// backend/src/controllers/aura.controller.js
const Groq = require('groq-sdk');
const AuraNote = require('../models/auraNote.model');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getGroqCompletion = async (systemPrompt, userText) => {
    const chatCompletion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userText },
        ],
        model: 'llama3-8b-8192',
    });
    return chatCompletion.choices[0]?.message?.content || '';
};

exports.saveNote = async (req, res) => {
    try {
        const { originalText } = req.body;
        const userId = req.user.id;
        if (!originalText) return res.status(400).json({ error: 'Original text is required.' });

        const explanationPrompt = `You are an AI assistant. Your task is to provide a clear and concise explanation of the user's text in simple, everyday English.`;
        const explanation = await getGroqCompletion(explanationPrompt, originalText);

        const newNote = new AuraNote({ originalText, explanation, userId });
        await newNote.save();
        res.status(201).json(newNote);
    } catch (error) {
        console.error("Error saving note:", error);
        res.status(500).json({ error: 'Server error while saving note.' });
    }
};

exports.getNotes = async (req, res) => {
    try {
        const userId = req.user.id;
        const notes = await AuraNote.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ error: 'Server error while fetching notes.' });
    }
};

// --- FIXED: More robust delete logic ---
exports.deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // First, find the note by its ID
        const note = await AuraNote.findById(id);

        // If the note doesn't exist at all, return 404
        if (!note) {
            return res.status(404).json({ error: 'Note not found.' });
        }

        // If the note exists, but the user ID doesn't match, return 403 (Forbidden)
        if (note.userId.toString() !== userId) {
            return res.status(403).json({ error: 'User not authorized to delete this note.' });
        }

        // If both checks pass, delete the note
        await AuraNote.findByIdAndDelete(id);

        res.status(200).json({ message: 'Note deleted successfully.' });
    } catch (error) {
        console.error("Error deleting note:", error);
        res.status(500).json({ error: 'Server error while deleting note.' });
    }
};
