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
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PATCH", "DELETE"]
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
    day: { type: Number, required: true },
    title: { type: String, required: true },
    topic: { type: String, required: true },
    explanation: { type: String, required: true },
    keyPoints: { type: [String], default: [] },
    status: { type: String, default: 'pending' },
    notes: { type: String, default: '' },
    youtubeSearchQueries: { type: [String], default: [] },
    referralSearchQueries: { type: [String], default: [] },
    questions: { type: [String], default: [] },
    pyqs: { type: [String], default: [] }
});

const PlanSchema = new mongoose.Schema({
    title: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sections: { type: [SectionSchema], default: [] },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

const FlashcardSchema = new mongoose.Schema({
    term: { type: String, required: true },
    definition: { type: String, required: true },
    example: { type: String }
});

const FlashcardSetSchema = new mongoose.Schema({
    topic: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cards: [FlashcardSchema],
    createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const AssessmentResultSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Plan = mongoose.model('Plan', PlanSchema);
const FlashcardSet = mongoose.model('FlashcardSet', FlashcardSetSchema);
const AssessmentResult = mongoose.model('AssessmentResult', AssessmentResultSchema);

// --- 5. AUTHENTICATION MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
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

// AUTH ROUTES
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User with this email already exists' });

        user = new User({ name, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const payload = { id: user.id };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error('Signup Error:', err);
        res.status(500).send('Server error');
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide both email and password.' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const payload = { id: user.id };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).send('Server error');
    }
});

// PLAN GENERATION ROUTE
app.post('/api/upload', authMiddleware, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded.' });
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) return res.status(400).json({ msg: 'Start and end dates are required.' });

    try {
        const sDate = new Date(startDate);
        const eDate = new Date(endDate);
        const diffTime = Math.abs(eDate - sDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays <= 0) {
            return res.status(400).json({ msg: 'End date must be after start date.' });
        }

        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdf(dataBuffer);
        const textContent = data.text;
        const totalChars = textContent.length;
        const charsPerDay = Math.floor(totalChars / diffDays);

        const textChunks = Array.from({ length: diffDays }, (_, i) => {
            const start = i * charsPerDay;
            const end = (i === diffDays - 1) ? totalChars : (i + 1) * charsPerDay;
            return textContent.substring(start, end);
        });

        const sectionPromises = textChunks.map(async (chunk, index) => {
            const dayNumber = index + 1;
            const prompt = `
                Analyze the provided text to create a study session for Day ${dayNumber}. Respond with a valid JSON object containing these exact keys:
                - "day": ${dayNumber}
                - "title": (string) A short, catchy title for the session.
                - "topic": (string) The main topic covered.
                - "explanation": (string) A very detailed, comprehensive explanation of the topic, at least 1000 words long.
                - "keyPoints": (array of strings) At least 10 distinct key points.
                - "youtubeSearchQueries": (array of strings) 4 effective YouTube search queries.
                - "referralSearchQueries": (array of strings) 4 effective Google search queries.
                - "questions": (array of strings) 5 thought-provoking questions.
                - "pyqs": (array of strings) 5 exam-style "Previous Year Questions".
                Text: "${chunk}"
            `;
            
            const fallbackSection = {
                day: dayNumber,
                title: `Topic for Day ${dayNumber}`,
                topic: "Content Generation Failed",
                explanation: "There was an error generating the detailed explanation for this topic. Please try generating the plan again.",
                keyPoints: [],
                youtubeSearchQueries: [],
                referralSearchQueries: [],
                questions: [],
                pyqs: []
            };

            try {
                const completion = await groq.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'llama3-70b-8192',
                    response_format: { type: "json_object" },
                });
                const content = completion.choices[0].message.content;
                let parsedContent = JSON.parse(content);

                if (!parsedContent.explanation || !parsedContent.title || !parsedContent.topic) {
                    console.error(`Validation failed for Day ${dayNumber}: AI response was missing required fields.`);
                    return fallbackSection;
                }
                
                return parsedContent;

            } catch (e) {
                console.error(`Error generating content for Day ${dayNumber}:`, e);
                return fallbackSection;
            }
        });

        const generatedSections = await Promise.all(sectionPromises);

        const newPlan = new Plan({
            title: req.file.originalname.replace('.pdf', ''),
            user: req.user.id,
            sections: generatedSections,
            startDate: sDate,
            endDate: eDate
        });

        await newPlan.save();
        res.status(201).json(newPlan);

    } catch (error) {
        console.error('Error in /api/upload:', error);
        res.status(500).json({ msg: 'Error creating study plan.' });
    } finally {
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
    }
});

// PLAN & SECTION ROUTES
app.get('/api/plans', authMiddleware, async (req, res) => {
    try {
        const plans = await Plan.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(plans);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

app.delete('/api/plans/:id', authMiddleware, async (req, res) => {
    try {
        const result = await Plan.deleteOne({ _id: req.params.id, user: req.user.id });
        if (result.deletedCount === 0) return res.status(404).json({ msg: 'Plan not found' });
        res.json({ msg: 'Plan removed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

app.patch('/api/plan/:planId/section/:sectionId', authMiddleware, async (req, res) => {
    try {
        const { planId, sectionId } = req.params;
        const updates = req.body;

        const plan = await Plan.findOne({ _id: planId, user: req.user.id });
        if (!plan) return res.status(404).json({ msg: 'Plan not found' });

        const section = plan.sections.id(sectionId);
        if (!section) return res.status(404).json({ msg: 'Section not found' });

        Object.assign(section, updates);
        await plan.save();
        res.json(plan);
    } catch (error) {
        console.error('Error updating section:', error);
        res.status(500).send('Server Error');
    }
});

app.get('/api/plan/:planId/section/:sectionId/download', authMiddleware, async (req, res) => {
    try {
        const { planId, sectionId } = req.params;
        const plan = await Plan.findOne({ _id: planId, user: req.user.id });
        if (!plan) return res.status(404).send('Plan not found');
        
        const section = plan.sections.id(sectionId);
        if (!section) return res.status(404).send('Section not found');

        let content = `Topic: ${section.title}\n\n`;
        content += `Explanation:\n${section.explanation}\n\n`;
        content += `Key Points:\n${(section.keyPoints || []).map(p => `- ${p}`).join('\n')}\n\n`;
        content += `Practice Questions:\n${(section.questions || []).map(q => `- ${q}`).join('\n')}\n\n`;
        content += `Notes:\n${section.notes || 'No notes yet.'}\n`;

        res.header('Content-Disposition', `attachment; filename="Day_${section.day}_${section.title}.txt"`);
        res.type('text/plain');
        res.send(content);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// ANALYTICS & SMART REVIEW ROUTES
app.get('/api/analytics', authMiddleware, async (req, res) => {
    try {
        const results = await AssessmentResult.find({ user: req.user.id })
            .populate('planId', 'title sections')
            .sort({ submittedAt: -1 });
        res.json(results);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Failed to fetch analytics data' });
    }
});

app.get('/api/analytics/smart-review', authMiddleware, async (req, res) => {
    try {
        const results = await AssessmentResult.find({ user: req.user.id }).populate('planId', 'title sections');
        
        const lowScoringTopics = results
            .filter(result => result.planId !== null) 
            .filter(result => (result.score / result.totalQuestions) < 0.6)
            .map(result => {
                const section = result.planId.sections.find(s => s._id.equals(result.sectionId));
                return {
                    planId: result.planId._id,
                    sectionId: result.sectionId,
                    title: section ? section.title : 'Unknown Topic',
                    planTitle: result.planId.title,
                };
            })
            .filter((value, index, self) => self.findIndex(t => t.sectionId.toString() === value.sectionId.toString()) === index);

        res.json(lowScoringTopics);
    } catch (error) {
        console.error('Error fetching smart review topics:', error);
        res.status(500).json({ message: 'Failed to fetch smart review topics' });
    }
});

// ASSESSMENT ROUTES
app.post('/api/generate-assessment', authMiddleware, async (req, res) => {
    const { topic } = req.body;
    try {
        const prompt = `Create a 10-question multiple-choice quiz on "${topic}". Return a JSON object with an "assessment" key, which is an array of objects. Each object must have "question", "options" (an array of 4 strings), and "correctAnswer".`;
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-8b-8192",
            response_format: { type: "json_object" },
        });
        const quizData = JSON.parse(completion.choices[0].message.content);
        res.json(quizData);
    } catch (error) {
        res.status(500).send('Failed to generate assessment');
    }
});

app.post('/api/submit-assessment', authMiddleware, async (req, res) => {
    try {
        const { planId, sectionId, answers, questions } = req.body;
        let score = 0;
        questions.forEach((q, index) => {
            if (q.correctAnswer.trim().toLowerCase() === answers[index].trim().toLowerCase()) {
                score++;
            }
        });

        const result = new AssessmentResult({
            user: req.user.id,
            planId,
            sectionId,
            score,
            totalQuestions: questions.length
        });

        await result.save();

        res.status(201).json({ score, totalQuestions: questions.length });

    } catch (error) {
        console.error('Error submitting assessment:', error);
        res.status(500).json({ msg: 'Server error while submitting assessment.' });
    }
});

// CHATBOT ROUTE
app.post('/api/chat', authMiddleware, async (req, res) => {
    try {
        const { history } = req.body;
        const stream = await groq.chat.completions.create({
            messages: history,
            model: 'llama3-8b-8192',
            stream: true,
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
        res.end();

    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).end();
    }
});


// FLASHCARD ROUTES
app.get('/api/flashcard-sets', authMiddleware, async (req, res) => {
    try {
        const sets = await FlashcardSet.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(sets);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.post('/api/generate-flashcards', authMiddleware, async (req, res) => {
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
});

app.delete('/api/flashcard-sets/:id', authMiddleware, async (req, res) => {
    try {
        const result = await FlashcardSet.deleteOne({ _id: req.params.id, user: req.user.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ msg: 'Flashcard set not found' });
        }
        res.json({ msg: 'Flashcard set deleted' });
    } catch (err) {
        res.status(500).send('Server error');
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
        rooms[roomId].users[socket.id] = { id: socket.id, name: userName };
        socket.roomId = roomId;
        socket.join(roomId);
        socket.emit('all-users', Object.values(rooms[roomId].users));
        socket.emit('room-state', {
            host: Object.keys(rooms[roomId].users)[0],
            whiteboard: rooms[roomId].whiteboardData,
            chatHistory: rooms[roomId].chatHistory,
            pomodoroState: rooms[roomId].pomodoroState
        });
    });

    socket.on('sending-signal', payload => {
        io.to(payload.userToSignal).emit('user-joined', {
            signal: payload.signal,
            callerID: payload.callerID,
            name: payload.name
        });
    });

    socket.on('returning-signal', payload => {
        io.to(payload.callerID).emit('receiving-returned-signal', {
            signal: payload.signal,
            id: socket.id
        });
    });

    socket.on('send-chat-message', ({ roomId, message }) => {
        if (rooms[roomId]) {
            rooms[roomId].chatHistory.push(message);
            // **FIX**: Changed to socket.to(roomId) to prevent sending the message back to the sender
            socket.to(roomId).emit('receive-chat-message', message);
        }
    });

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
        if (data.roomId && rooms[data.roomId]) {
            rooms[data.roomId].whiteboardData = data.data;
            socket.to(data.roomId).emit('whiteboard-draw', data.data);
        }
    });

    socket.on('disconnect', () => {
        const roomId = socket.roomId;
        if (roomId && rooms[roomId]?.users[socket.id]) {
            delete rooms[roomId].users[socket.id];
            socket.to(roomId).emit('user-left', { id: socket.id });
            if (Object.keys(rooms[roomId].users).length === 0) {
                delete rooms[roomId];
            }
        }
    });
});

// --- 9. START SERVER ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
