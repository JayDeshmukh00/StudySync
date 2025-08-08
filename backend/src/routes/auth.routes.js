const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// --- ADDED: Import your authentication middleware ---
// Make sure the path is correct relative to this file.
const authMiddleware = require('../middleware/auth.middleware.js');


// --- Your existing routes (UNCHANGED) ---
router.post('/signup', authController.signup);
router.post('/login', authController.login);


// --- ADDED: The new route for getting the logged-in user's data ---
// This route is protected. It first runs the middleware to verify the token.
// If the token is valid, it then proceeds to the authController.getMe function.
router.get('/me', authMiddleware, authController.getMe);


module.exports = router;
