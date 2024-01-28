import multer from "multer"
import {z} from "zod";
import crypto from "crypto";
import {allowedFileTypes, Document} from "../models/documentModel.js";
import {getDocument} from "pdfjs-dist";
import {fileURLToPath} from 'url';
import {dirname, join} from "path"
import OpenAI from "openai";
import {CONFIG} from "../configs/envConfig.mjs";
import mammoth from "mammoth";
import {auth, getUserSession} from "../utils/lucia.mjs";
import Logging from "../utils/logger.mjs";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const standardFontsPath = join(__dirname, '../../node_modules/pdfjs-dist/standard_fonts/');

const storage = multer.memoryStorage(); // Armazenar em memória para verificar integridade

function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const openai = new OpenAI({
    apiKey: CONFIG.OPEN_AI_API_KEY,
});

async function extractKeywords(buffer, mime) {
    try {
        let documentText = ''
        switch (mime) {
            //application/pdf or .pdf
            case allowedFileTypes[0]: {
                //Convert pdf buffer to Uint8Array
                const pdfBuffer = new Uint8Array(buffer);
                //Initialize keyword array
                //Read PDF from Buffer
                const pdfDocument = await getDocument({
                    data: pdfBuffer,
                    standardFontDataUrl: standardFontsPath,
                }).promise;
                //Initialize pdf text array
                //LOOP OVER PDF PAGES
                for (let i = 1; i < pdfDocument.numPages; i++) {
                    //GET PDF PAGE
                    const page = await pdfDocument.getPage(i);
                    //EXTRACT TEXT CONTENT
                    const pageContent = await page.getTextContent();

                    //CHECK IF PDF PAGE CONTAINS DATA
                    if (pageContent && pageContent.items && pageContent.items.length > 0) {
                        //LOOP OVER PDF ITEMS OBJECT
                        for (let j = 0; j < pageContent.items.length; j++) {
                            //GET THE ITEM
                            const item = pageContent.items[j];
                            //CHECK IF THE ITEM CONTAINS TEXT
                            if (item.str) {
                                //ADD TEXT TO PDFTEXT STRING
                                documentText+= item.str
                            }
                        }
                    }
                }
                break;
            }
            //application/vnd.openxmlformats-officedocument.wordprocessingml.document or .docx
            case allowedFileTypes[1]: {
                documentText = (await mammoth.extractRawText({buffer})).value;
                break;
            }
            default: {
                break;
            }
        }

        //START AI ASSISTANT LOGIC
        const thread = await openai.beta.threads.create();

        //CREATE CHAT
        await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: documentText,
        });

        //RUN AI ASSISTANT
        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: "asst_yJJNA8YwxOdLgWE0brBT5zAy",
        });

        //Check run status
        let runStatus = await openai.beta.threads.runs.retrieve(
            thread.id,
            run.id
        );

        //Pooling to check if the analysis is done.
        while (runStatus.status !== "completed") {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        }
        const messages = await openai.beta.threads.messages.list(thread.id);

        // Find AI Response
        const lastMessage = messages.data
            .filter(
                (message) => message.run_id === run.id && message.role === "assistant"
            )
            .pop();
        if(lastMessage){
            //Convert into readable javascript array
            return JSON.parse(new Array(lastMessage.content[0].text.value));
        }else{
            return []
        }

    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw error; // Rejeitar o erro para notificar chamadores da função sobre falha.
    }
}

function fileFilter(req, file, callback) {
    if (allowedFileTypes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(new Error('Invalid content-type'), false);
    }
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
});

const fileSchema = z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.string().refine(value => allowedFileTypes.includes(value), {
        message: "Invalid content-type",
    }),
    buffer: z.instanceof(Buffer),
    size: z.number(),
});

function generateSHA256Hash(buffer) {
    return crypto.createHash("sha256").update(buffer).digest('hex')
}

/**
 * upload a document and handle its processing
 **/
export function uploadDocument(req, res) {
    upload.single('document')(req, res, async (err) => {
        if (err) {
            new Error(err)
            return res.status(400).json({error: err.message});
        }

        try {
            const session = await getUserSession(req, res)
            //Parse file values to check if its valid
            const file = fileSchema.parse(req.file);
            //Create a unique hash to link to that file
            const fileHash = generateSHA256Hash(file.buffer)
            //Store file inside database

            const document = new Document({
                fieldname: file.fieldname,
                originalname: file.originalname,
                encoding: file.encoding,
                mimetype: file.mimetype,
                date: Date.now(),
                buffer: file.buffer,
                userId: session.user.userId,
                hash: fileHash,
            })

            await document.save()
            res.status(200).json({message: 'File uploaded successfully'});

            //Start keyword indexing after file is uploaded
            document.keywords = await extractKeywords(file.buffer, file.mimetype)
            await document.save()
        } catch (error) {
            console.error(error);
            new Error(error)
            res.status(500).json({error: 'Error parsing file object'});
        }
    });
}

/**
 * returns all existing documents
 * @constructor
 * @param {Request} req - Context Request
 * @param {Response} res - Context Response
 */

export async function getDocuments(req, res) {
    try {
        const result = await getUserSession(req, res);
        const searchParams = String(req.query.search) || "";
        if (result && !searchParams) {
            const docs = await Document.find({ userId: result.user.userId, trashed: false });
            res.status(200).json({ docs, success: true });
        }else if(result && searchParams) {
            const docs = await Document.find({ userId: result.user.userId, trashed: false, $text: { $search: searchParams, $caseSensitive: false } });
            res.status(200).json({ docs, success: true });
        }
        else {
            res.status(500).json({ docs: [], success: false });
        }
    } catch (error) {
        Logging.error(error);
        res.status(500).json({ docs: [], success: false, message: "Internal Server Error" });
    }
}



/**
 * returns a document based on its ID
 * @constructor
 * @param {Express.Request} req - Context Request
 * @param {Express.Response} res - Context Response
 */
export function getDocumentById(req, res) {
    // Implementar lógica para obter um documento por ID
}

/**
 * Updates a existing document based on its ID
 * @constructor
 * @param {Express.Request} req - Context Request
 * @param {Express.Response} res - Context Response
 */
export function updateDocument(req, res) {
    // Implementar lógica para atualizar um documento
}

/**
 * Deletes a document based on its hash
 * @constructor
 * @param {Request} req - Context Request
 * @param {Response} res - Context Response
 */
export async function deleteDocument(req, res) {
    try {
        const result = await getUserSession(req, res);
        const hash = String(req.params.hash);

        if (result && hash) {
            const doc = await Document.findOne({ userId: result.user.userId, trashed: false, hash });

            if (doc) {
                doc.trashed = true;
                await doc.save();
                res.status(200).json({ doc, success: true });
            } else {
                res.status(404).json({ success: false, message: "Document not found" });
            }
        } else {
            res.status(400).json({ success: false, message: "Invalid request parameters" });
        }
    } catch (error) {
        Logging.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export async function searchDocument(req, res) {
    try {
        const result = await getUserSession(req, res);
        const searchParams = String(req.params.search);

        if (result && search) {
            const docs = await Document.find({ userId: result.user.userId, trashed: false, $text: { search: searchParams } });

            if (docs) {
                res.status(200).json({ docs, success: true });
            } else {
                res.status(404).json({ success: false, message: "Document not found" });
            }
        } else {
            res.status(400).json({ success: false, message: "Invalid request parameters" });
        }
    } catch (error) {
        Logging.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}