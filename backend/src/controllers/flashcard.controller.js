
// src/controllers/flashcard.controller.js
const FlashcardSet = require('../models/flashcardSet.model');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.getAllFlashcardSets = async (req, res) => {
    try {
        const sets = await FlashcardSet.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(sets);
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.generateFlashcards = async (req, res) => {
    const { topic } = req.body;
    if (!topic || topic.trim() === '') {
        return res.status(400).json({ msg: 'Topic is required' });
    }
    try {
        const prompt = `Create 15 flashcards for "${topic}". Return a JSON object with a "topic" string and a "cards" array of objects with "term" and "definition" keys.`;
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama3-8b-8192',
            response_format: { type: 'json_object' },
        });
        const flashcardData = JSON.parse(completion.choices[0].message.content);
        const newSet = new FlashcardSet({
            topic: flashcardData.topic || topic,
            user: req.user.id,
            cards: flashcardData.cards || []
        });
        await newSet.save();
        res.status(201).json(newSet);
    } catch (err) {
        res.status(500).json({ msg: 'Failed to generate flashcards' });
    }
};

exports.deleteFlashcardSet = async (req, res) => {
    try {
        const result = await FlashcardSet.deleteOne({ _id: req.params.id, user: req.user.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ msg: 'Flashcard set not found' });
        }
        res.json({ msg: 'Flashcard set deleted' });
    } catch (err) {
        res.status(500).send('Server error');
    }
};
