const mongoose = require('mongoose');

const FlashcardSchema = new mongoose.Schema({
    term: { type: String, required: true },
    definition: { type: String, required: true },
    example: { type: String }
});

const FlashcardSetSchema = new mongoose.Schema({
    topic: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cards: [FlashcardSchema],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FlashcardSet', FlashcardSetSchema);