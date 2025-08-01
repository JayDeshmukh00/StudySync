// server.js

// --- 1. IMPORTS ---
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const Groq = require('groq-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require("socket.io");

require('dotenv').config();

// --- 2. SERVER & DATABASE CONFIGURATION ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Your React app's URL
        methods: ["GET", "POST"]
    }
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret-key';

// --- 3. MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 4. DATABASE CONNECTION & SCHEMAS ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch(err => { console.error('Connection error', err); process.exit(1); });

const SectionSchema = new mongoose.Schema({
    topic: { type: String, required: true },
    explanation: { type: String, required: true },
    duration: { type: Number, required: true },
    completed: { type: Boolean, default: false }
});

const PlanSchema = new mongoose.Schema({
    title: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sections: [SectionSchema],
    createdAt: { type: Date, default: Date.now }
});

// CORRECTED: User schema now uses email as the unique identifier.
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);
const Plan = mongoose.model('Plan', PlanSchema);

// --- 5. AUTHENTICATION MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { id: decoded.id };
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// --- 6. FILE UPLOAD CONFIGURATION ---
const upload = multer({ dest: 'uploads/' });

// --- 7. API ROUTES ---

// User Signup
app.post('/api/auth/signup', async (req, res) => {
    // CORRECTED: Destructure name, email, and password, which the frontend is sending.
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        console.log('Signup attempt failed: Missing name, email, or password.');
        return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }
    try {
        // Check if a user with this email already exists.
        let user = await User.findOne({ email });
        if (user) {
            console.log(`Signup attempt failed: Email '${email}' already exists.`);
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        user = new User({ name, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        
        console.log(`User '${name}' successfully registered with email '${email}'.`);

        const payload = { id: user.id };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error('An error occurred during signup:', err.message);
        res.status(500).send('Server error');
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    // CORRECTED: Destructure email and password.
    const { email, password } = req.body;
    if (!email || !password) {
        console.log('Login attempt failed: Missing email or password.');
        return res.status(400).json({ message: 'Please provide both email and password.' });
    }
    try {
        // Find the user by email.
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`Login attempt failed: User with email '${email}' not found.`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`Login attempt failed: Incorrect password for user with email '${email}'.`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        console.log(`User '${user.name}' successfully logged in.`);

        const payload = { id: user.id };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error('An error occurred during login:', err.message);
        res.status(500).send('Server error');
    }
});

// PDF Upload and Plan Generation
app.post('/api/upload', authMiddleware, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    try {
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdf(dataBuffer);
        const textContent = data.text;

        const prompt = `Based on the following text, create a detailed study plan. The output should be a JSON object with a "title" (string) and "sections" (array of objects). Each section object must have "topic" (string), "explanation" (string, a detailed breakdown of the topic), and "duration" (number, in minutes). The text is: "${textContent}"`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama3-8b-8192',
            response_format: { type: "json_object" },
        });

        const planData = JSON.parse(completion.choices[0].message.content);
        const newPlan = new Plan({
            title: planData.title || req.file.originalname,
            user: req.user.id,
            sections: planData.sections
        });
        await newPlan.save();
        res.status(201).json(newPlan);
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).send('Error creating study plan.');
    } finally {
        fs.unlinkSync(req.file.path);
    }
});

// Fetch All Plans for a User
app.get('/api/plans', authMiddleware, async (req, res) => {
    try {
        const plans = await Plan.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(plans);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Generate Assessment
app.post('/api/generate-assessment', authMiddleware, async (req, res) => {
    const { topic, explanation } = req.body;
    try {
        const prompt = `Create a 5-question multiple-choice quiz on the topic "${topic}". The explanation is: "${explanation}". Return a JSON object with an "assessment" key, which is an array of question objects. Each object must have "question" (string), "options" (array of 4 strings), and "correctAnswer" (string, one of the options).`;
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-8b-8192",
            response_format: { type: "json_object" },
        });
        const quizData = JSON.parse(completion.choices[0].message.content);
        res.json(quizData);
    } catch (error) {
        console.error('Error generating assessment:', error);
        res.status(500).send('Failed to generate assessment');
    }
});


// --- 8. REAL-TIME COLLABORATIVE LOGIC ---
const rooms = {};

io.on('connection', (socket) => {
    socket.on('join-room', ({ roomId, userName }) => {
        if (!rooms[roomId]) {
            rooms[roomId] = {
                users: {},
                chatHistory: [],
                pomodoroState: { mode: 'work', timeLeft: 25 * 60, isRunning: false },
                whiteboardData: null
            };
        }
        const otherUsers = Object.values(rooms[roomId].users);

        rooms[roomId].users[socket.id] = { id: socket.id, name: userName };
        socket.roomId = roomId;
        socket.join(roomId);

        socket.emit('all-users', otherUsers);
        socket.emit('room-state', {
            host: Object.keys(rooms[roomId].users)[0],
            whiteboard: rooms[roomId].whiteboardData,
            chatHistory: rooms[roomId].chatHistory,
            pomodoroState: rooms[roomId].pomodoroState
        });
    });

    socket.on('sending-signal', payload => {
        io.to(payload.userToSignal).emit('user-joined', { signal: payload.signal, callerID: payload.callerID, name: payload.name });
    });

    socket.on('returning-signal', payload => {
        io.to(payload.callerID).emit('receiving-returned-signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('send-chat-message', ({ roomId, message }) => {
        if (rooms[roomId]) {
            rooms[roomId].chatHistory.push(message);
            socket.to(roomId).emit('receive-chat-message', message);
        }
    });

    // Added handler for request-chat-history to send chat history to client
    socket.on('request-chat-history', (roomId) => {
        if (rooms[roomId]) {
            socket.emit('chat-history', rooms[roomId].chatHistory);
        }
    });

    socket.on('sync-pomodoro', ({ roomId, newState }) => {
        if (rooms[roomId]) {
            rooms[roomId].pomodoroState = newState;
            socket.to(roomId).emit('sync-pomodoro', newState);
        }
    });

    socket.on('whiteboard-draw', (data) => {
        if (rooms[data.roomId]) {
            rooms[data.roomId].whiteboardData = data.data;
            socket.to(data.roomId).emit('whiteboard-draw', data.data);
        }
    });
    
    socket.on('disconnect', () => {
        const roomId = socket.roomId;
        if (roomId && rooms[roomId]?.users[socket.id]) {
            const userName = rooms[roomId].users[socket.id].name;
            console.log(`${userName} disconnected from room ${roomId}`);
            
            delete rooms[roomId].users[socket.id];
            socket.to(roomId).emit('user-left', { id: socket.id });

            if (Object.keys(rooms[roomId].users).length === 0) {
                console.log(`Room ${roomId} is empty, deleting.`);
                delete rooms[roomId];
            }
        }
    });
});

// --- 9. START SERVER ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
