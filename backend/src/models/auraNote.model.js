// backend/src/models/auraNote.model.js
const mongoose = require('mongoose');

const auraNoteSchema = new mongoose.Schema({
    originalText: {
        type: String,
        required: true,
        trim: true,
    },
    explanation: {
        type: String,
        required: true,
        trim: true,
    },
    // In a real app, you would also link to the specific PDF document
    // documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' }, 
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

const AuraNote = mongoose.model('AuraNote', auraNoteSchema);

module.exports = AuraNote;
