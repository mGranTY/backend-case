import mongoose, {Schema} from "mongoose";

export const allowedFileTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

const documentSchema = new Schema({
    fieldname: String,
    originalname: String,
    encoding: String,
    mimetype: String,
    date: { type: Date, default: Date.now },
    buffer: { type: 'Buffer'},
    userId: String,
    permissions: [String],
    keywords: [String],
    hash: String,
    trashed: {type: Boolean, default: false},
    trashedAt: Date,
});

documentSchema.index({fieldname: 'text', originalname: 'text', encoding: 'text', mimetype: 'text', keywords: 'text'});

export const Document = mongoose.model('Document', documentSchema);