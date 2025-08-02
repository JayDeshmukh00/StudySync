// src/config/db.js

const mongoose = require('mongoose');
require('dotenv').config();

// --- DATABASE CONNECTION ---
// This file handles the connection logic to MongoDB.
// It reads the connection string from your .env file.
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        // Exit the process with failure code if we can't connect to the DB.
        process.exit(1);
    });
