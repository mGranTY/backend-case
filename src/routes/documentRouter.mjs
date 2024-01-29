import express from 'express';

import {
    deleteDocument,
    getDocuments,
    searchDocument,
    uploadDocument
} from "../controller/documentController.mjs";

export const documentRouter = express.Router();

documentRouter.get('/getDocuments', getDocuments);
documentRouter.post('/uploadDocument', uploadDocument);
// documentRouter.put('/updateDocument/:hash', updateDocument);
documentRouter.delete('/deleteDocument/:hash', deleteDocument);
documentRouter.get('/searchDocument/:search', searchDocument)
