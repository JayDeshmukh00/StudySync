
// src/routes/flashcard.routes.js
const express = require('express');
const router = express.Router();
const flashcardController = require('../controllers/flashcard.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/flashcard-sets', authMiddleware, flashcardController.getAllFlashcardSets);
router.post('/generate-flashcards', authMiddleware, flashcardController.generateFlashcards);
router.delete('/flashcard-sets/:id', authMiddleware, flashcardController.deleteFlashcardSet);

module.exports = router;