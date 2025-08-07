// backend/src/routes/aura.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware'); // Assuming you have this
const { saveNote, getNotes,deleteNote } = require('../controllers/aura.controller');

// @route   POST /api/aura/notes
// @desc    Save a new note with an AI explanation
// @access  Private
router.post('/notes', authMiddleware, saveNote);

// @route   GET /api/aura/notes
// @desc    Get all notes for the logged-in user
// @access  Private
router.get('/notes', authMiddleware, getNotes);


// delete note route
router.delete('/notes/:id', authMiddleware, deleteNote);

module.exports = router;
