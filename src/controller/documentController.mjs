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
import {getUserSession} from "../utils/lucia.mjs";
import Logging from "../utils/logger.mjs";


// The `import.meta.url` gives the URL representation of the current module
// The `fileURLToPath()` method is used to convert this URL into the absolute path of the module
const __filename = fileURLToPath(import.meta.url);
// The `dirname()` function from the 'path' module to extract the directory name of the `__filename`
// The path to the current directory in the file system that the current module resides in
const __dirname = dirname(__filename);
let standardFontsPath;

if (CONFIG.NODE_ENV === 'production') {
    // In production/bundled environment, the fonts are in the bundled 'dist' directory
    standardFontsPath = join(__dirname, './standard_fonts/');
} else {
    // In development, the fonts are in 'public/assets'
    standardFontsPath = join(__dirname, '../../public/assets/standard_fonts/');
}

const storage = multer.memoryStorage(); // Armazenar em memória para verificar integridade

const openai = new OpenAI({
    apiKey: CONFIG.OPEN_AI_API_KEY,
});

/**
 * This function is responsible for extract keywords from a document using the OpenAI API.
 * It supports documents of the type PDF and DOCX.
 *
 * @param {Buffer} buffer - The buffer data from the uploaded file.
 * @param {string} mime - The file type of the uploaded file.
 * @returns {Promise} - A promise that resolves to an array of keywords extracted from the document.
 * @throws {Error} - Throws an error if failed to extract keywords.
 */
async function extractKeywords(buffer, mime) {
    try {
        //Initiate a container for document text
        let documentText = ''

        switch (mime) {
            case allowedFileTypes[0]: { // when file type is PDF
                //Convert pdf buffer to Uint8Array
                const pdfBuffer = new Uint8Array(buffer);

                // Then, uses pdf.js to read PDF from the buffer
                const pdfDocument = await getDocument({
                    data: pdfBuffer,
                    standardFontDataUrl: standardFontsPath,
                }).promise;

                //LOOP OVER PDF PAGES: Extracts text content from each page of the document
                for (let i = 1; i <= pdfDocument.numPages; i++) {
                    //GET PDF PAGE
                    const page = await pdfDocument.getPage(i);  // Get text content of the page
                    const pageContent = await page.getTextContent();
                    //Iterate over page's items and append the text data of each item to the documentText variable;
                    //Extracts text content from each item of the document, these items could be text or image or etc..
                    //Uses 'str' property to get the text.
                    pageContent.items.forEach(item => {
                        if (item.str) {
                            documentText += item.str;
                        }
                    });
                }
                break;
            }
            case allowedFileTypes[1]: { // when file type is DOCX
                //Extract text from DOCX format using mammoth.js
                documentText = (await mammoth.extractRawText({buffer})).value;
                break;
            }
            default: {
                break;
            }
        }

        //After getting text data, use OpenAI to extract keywords
        //Creates a new chat thread
        const thread = await openai.beta.threads.create();

        //Pushes user role message to the thread, The content of the user message is actual document text
        await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: documentText,
        });

        //Runs the AI assistant
        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: "asst_yJJNA8YwxOdLgWE0brBT5zAy",
        });

        //Check for the results (keywords in this case)
        let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

        //Pooling to check if the analysis is done.
        while (runStatus.status !== "completed") {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        }
        //When the assistant is done with processing, collect the messages from the thread.
        const messages = await openai.beta.threads.messages.list(thread.id);

        // Find AI Response (assistant's message)
        // Gets the last assistant message from the thread, which is supposed to be the list of keywords
        const lastMessage = messages.data
            .filter((message) => message.run_id === run.id && message.role === "assistant")
            .pop();

        //Parse the message to a proper object and return it.
        return lastMessage ? JSON.parse(new Array(lastMessage.content[0].text.value)) : []

    } catch (error) {
        // Log error and throw it further.
        Logging.error('Error extracting text from PDF:', error);
        throw error;
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

// function for dividing the main related tasks  into smaller separate functions
export function uploadDocument(req, res) {

    // Uploads the single document on request
    upload.single('document')(req, res, async (err) => {
        // error handling
        if (err) {
            handleError(err, res);
            return;
        }

        // Calls the following functions to handle document processing and db operations
        try {
            const session = await getUserSession(req, res);
            const file = fileSchema.parse(req.file);
            const fileHash = generateSHA256Hash(file.buffer);
            const document = await saveDocument(file, session.user.userId, fileHash);

            res.status(200).json({message: 'File uploaded and saved successfully'});
            document.keywords = await extractKeywords(file.buffer, file.mimetype);
            await document.save();
        }
        catch(error) {
            handleError(error, res);
        }
    });
}

// Function for error handling - enables us to maintain a DRY principle and reuse in multiple places
function handleError(error, res) {
    console.error(error);
    res.status(500).json({error: 'An internal error occurred while processing the request'});
    new Error(error);
}


// Function to Save the document in DB
async function saveDocument(file, userId, fileHash) {
    const document = new Document({
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        date: Date.now(),
        buffer: file.buffer,
        userId: userId,
        hash: fileHash,
    });

    // Saves the document and returns
    return await document.save();
}

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



// This function handles the deletion of a document
export async function deleteDocument(req, res) {
    // Try block to handle any potential errors
    try {
        // Retrieve user session details
        const result = await getUserSession(req, res);
        // Retrieve the required document hash from the request parameters
        const hash = String(req.params.hash);

        // Conditional to check if there is a result and a hash provided
        if (result && hash) {
            // Retrieve a non-trashed document from MongoDB that belongs to the current user
            const doc = await Document.findOne({ userId: result.user.userId, trashed: false, hash });

            // Conditional to check if the document exists
            if (doc) {
                // Flag the document as having been trashed
                doc.trashed = true;
                // Save the changes to the document
                await doc.save();
                // Return a response to the client indicating the successful deletion of the document
                res.status(200).json({ doc, success: true });
            } else {
                // Return a response to the client indicating that the document was not found
                res.status(404).json({ success: false, message: "Document not found" });
            }
        } else {
            // Return a response to the client indicating that the request parameters were invalid
            res.status(400).json({ success: false, message: "Invalid request parameters" });
        }
    } catch (error) {
        // Log any errors
        Logging.error(error);
        // Return a response to the client indicating that there was an internal server error
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

// @@DEPRECATED
// This function handles the searching of documents.
export async function searchDocument(req, res) {
    // Try block to handle any errors.
    try {
        // Retrieve user session details.
        const result = await getUserSession(req, res);
        // Retrieve the search parameters from the request parameters.
        const searchParams = String(req.params.search);

        // Check if there is a result and a search string provided.
        if (result && searchParams) {
            // Use MongoDB's $text operator to perform a text search on the documents that belong to the user.
            const docs = await Document.find({ userId: result.user.userId, trashed: false, $text: { $search: searchParams } });

            // Check if any documents were found.
            if (docs) {
                // Return a response to the client containing the found documents.
                res.status(200).json({ docs, success: true });
            } else {
                // Return a response to the client indicating that no documents were found.
                res.status(404).json({ success: false, message: "Document not found" });
            }
        } else {
            // Return a response to the client indicating that the request parameters were invalid.
            res.status(400).json({ success: false, message: "Invalid request parameters" });
        }
    } catch (error) {
        // Log any errors.
        Logging.error(error);
        // Return a response to the client indicating that there was an internal server error.
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}