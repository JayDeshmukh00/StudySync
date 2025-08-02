// src/routes/assessment.routes.js
const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessment.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/generate-assessment', authMiddleware, assessmentController.generateAssessment);
router.post('/submit-assessment', authMiddleware, assessmentController.submitAssessment);

module.exports = router;