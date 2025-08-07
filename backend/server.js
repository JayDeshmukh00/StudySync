// --- 1. IMPORTS ---
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
require('dotenv').config();

// --- 2. SETUP ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Your frontend URL
        methods: ["GET", "POST", "PATCH", "DELETE"]
    }
});
const PORT = process.env.PORT || 3001;

// --- 3. DATABASE & SERVICES ---
require('./src/config/db'); // Initialize and connect to the database
require('./src/services/socket.service')(io); // Initialize Socket.IO logic

// --- 4. MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 5. API ROUTES ---
const authRoutes = require('./src/routes/auth.routes');
const planRoutes = require('./src/routes/plan.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');
const assessmentRoutes = require('./src/routes/assessment.routes');
const chatRoutes = require('./src/routes/chat.routes');
const flashcardRoutes = require('./src/routes/flashcard.routes');
const buddyRoutes = require('./src/routes/buddy.js');
const auraRoutes = require('./src/routes/aura.routes.js'); // <-- ADDED: Import Aura Reader routes

// Define the base path for each route module
app.use('/api/auth', authRoutes);
app.use('/api', planRoutes); // Handles /upload, /plans, etc.
app.use('/api/analytics', analyticsRoutes);
app.use('/api', assessmentRoutes); // Handles /generate-assessment, /submit-assessment
app.use('/api/chat', chatRoutes);
app.use('/api', flashcardRoutes); // Handles /flashcard-sets, /generate-flashcards
app.use('/api/buddy', buddyRoutes);
app.use('/api/aura', auraRoutes); // <-- ADDED: Use Aura Reader routes

// --- 6. START SERVER ---
server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
