
// src/routes/analytics.routes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, analyticsController.getAnalytics);
router.get('/smart-review', authMiddleware, analyticsController.getSmartReviewTopics);

module.exports = router;