// server.js

// Import necessary packages
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

require('dotenv').config();

// --- Server Configuration ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- Groq AI Client ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch(err => { console.error('Connection error', err); process.exit(1); });

// --- Database Schemas and Models ---
const userSchema = new mongoose.Schema({ name: { type: String, required: true }, email: { type: String, required: true, unique: true }, password: { type: String, required: true } });
const sectionSchema = new mongoose.Schema({ day: Number, title: String, topic: String, explanation: String, keyPoints: [String], youtubeSearchQueries: [String], referralSearchQueries: [String], questions: [String], pyqs: [String], status: { type: String, default: 'pending' }, notes: { type: String, default: '' } });
const studyPlanSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, title: { type: String, required: true }, originalFileName: { type: String, required: true }, startDate: { type: Date, required: true }, endDate: { type: Date, required:true }, sections: [sectionSchema], createdAt: { type: Date, default: Date.now } });
const assessmentResultSchema = new mongoose.Schema({ planId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan', required: true }, sectionId: { type: mongoose.Schema.Types.ObjectId, required: true }, score: { type: Number, required: true }, totalQuestions: { type: Number, required: true }, takenAt: { type: Date, default: Date.now } });

// NEW, IMPROVED SCHEMA:
const flashcardSchema = new mongoose.Schema({
    term: { type: String, required: true },
    definition: { type: String, required: true },
    example: { type: String } // Example is optional
});
const flashcardSetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: String, required: true },
    cards: [flashcardSchema],
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);
const AssessmentResult = mongoose.model('AssessmentResult', assessmentResultSchema);
const FlashcardSet = mongoose.model('FlashcardSet', flashcardSetSchema);

// --- File Upload Handling (Multer) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB file size limit

// --- AI Helper Functions ---
async function summarizePdfText(text) {
    console.log("Starting summarization for large PDF text...");
    const MAX_CHUNK_SIZE = 15000; // Increased chunk size for efficiency
    const textChunks = [];
    for (let i = 0; i < text.length; i += MAX_CHUNK_SIZE) {
        textChunks.push(text.substring(i, i + MAX_CHUNK_SIZE));
    }

    if (textChunks.length <= 1) {
        console.log("Text is short, no summarization needed.");
        return text;
    }

    console.log(`Splitting text into ${textChunks.length} chunks for summarization.`);
    let summarizedChunks = [];

    for (const chunk of textChunks) {
        try {
            const summaryCompletion = await groq.chat.completions.create({
                messages: [{
                    role: 'user',
                    content: `Please provide a concise summary of the key educational topics, concepts, and main ideas from the following text. Text: """${chunk}"""`
                }],
                model: 'llama3-8b-8192',
                temperature: 0.2,
            });
            summarizedChunks.push(summaryCompletion.choices[0]?.message?.content);
        } catch (error) {
            console.error("Error summarizing a chunk:", error);
            summarizedChunks.push("[Chunk summary failed]");
        }
    }
    
    console.log("Finished summarizing all chunks.");
    return `This is a coherent summary compiled from a larger document. The key topics are: \n${summarizedChunks.join('\n\n')}`;
}

async function getGroqStudyPlan(pdfSummary, startDate, endDate, fileName) {
    console.log('Sending request to Groq API for study plan...');
    const prompt = `
        You are an expert learning assistant. Your task is to create a comprehensive, detailed, day-by-day study plan from ${startDate} to ${endDate}, based on the provided text summary from a book titled "${fileName}".
        For each day, you MUST provide a rich and helpful set of resources. The response must be a valid JSON object.

        **CRITICAL INSTRUCTIONS:**
        1.  **Explanation Field:** The "explanation" for each day MUST be exceptionally detailed and at least 500 words long. It should be broken down into multiple paragraphs, explaining the core concepts in a clear, easy-to-understand manner.
        2.  **Complete All Fields:** You MUST generate content for ALL fields in the JSON structure for every single day. No field should be an empty array or null.
        3.  **PYQs Field:** For the "pyqs" (Previous Year Questions) field, if no specific previous year questions are known or applicable, you MUST generate 4-5 challenging, exam-style questions that are relevant to the day's topic and label them appropriately. DO NOT leave this field empty.
        4.  **Search Queries:** For "youtubeSearchQueries" and "referralSearchQueries", provide 2-3 effective and concise search queries. Do NOT provide full URLs.
        5.  **Key Points:** The "keyPoints" list must contain at least 7-8 crucial takeaways.

        The output MUST be a valid JSON object with a single key "studyPlan" which is an array of objects.
        Each object in the array represents a single day's plan and must have the exact following structure:
        {
          "day": <integer>,
          "title": "<string>",
          "topic": "<string>",
          "explanation": "<string, min 500 words>",
          "keyPoints": ["<array of at least 7 strings>"],
          "youtubeSearchQueries": ["<array of 2-3 strings>"],
          "referralSearchQueries": ["<array of 2-3 strings>"],
          "questions": ["<array of 4-5 strings>"],
          "pyqs": ["<array of 4-5 strings, NO EMPTY ARRAYS>"]
        }
        ---
        PDF SUMMARY CONTENT:
        ${pdfSummary.substring(0, 25000)} 
        ---
    `;
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama3-70b-8192',
            temperature: 0.6,
            max_tokens: 8000,
            response_format: { type: "json_object" },
        });
        return chatCompletion.choices[0]?.message?.content;
    } catch (error) {
        console.error("Error calling Groq API for study plan:", error);
        throw new Error("Failed to get study plan from AI service.");
    }
}

async function getGroqAssessment(topic, explanation) {
    console.log('Sending request to Groq API for assessment...');
    const prompt = `
        Based on the following topic and explanation, generate a multiple-choice quiz with 10 questions to test a user's understanding.
        Topic: ${topic}
        Explanation: ${explanation}
        The output MUST be a valid JSON object with a single key "assessment" which is an array of 10 objects.
        Each object must have keys: "question", "options" (an array of 4 strings), and "correctAnswer" (the string of the correct option). Ensure the correctAnswer is an exact match to one of the strings in the options array.
    `;
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama3-70b-8192',
            temperature: 0.7,
            max_tokens: 4096,
            response_format: { type: "json_object" },
        });
        return chatCompletion.choices[0]?.message?.content;
    } catch (error) {
        console.error("Error calling Groq API for assessment:", error);
        throw new Error("Failed to get assessment from AI service.");
    }
}


// REPLACE the old getGroqFlashcards function with this one
async function getGroqFlashcards(topic) {
    console.log('Sending request to Groq API for RICH flashcards...');
    const prompt = `
        You are a learning expert. Generate a set of 15 high-quality flashcards for the topic: "${topic}".
        The output MUST be a valid JSON object with a single key "flashcards".
        Each object in the "flashcards" array must have the following exact structure:
        {
          "term": "<string> - A concise keyword or concept.",
          "definition": "<string> - A clear, detailed definition of the term.",
          "example": "<string> - A short, practical code snippet or real-world example. If no example is relevant, provide a helpful analogy."
        }
        Ensure the content is accurate and educational.
    `;
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama3-70b-8192',
            temperature: 0.6,
            max_tokens: 4096,
            response_format: { type: "json_object" },
        });
        return chatCompletion.choices[0]?.message?.content;
    } catch (error) {
        console.error("Error calling Groq API for flashcards:", error);
        throw new Error("Failed to get flashcards from AI service.");
    }
}

// --- Authentication Middleware ---
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (e) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// --- API Routes ---

// --- Auth Routes ---
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }
        user = new User({ name, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 36000 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 36000 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// --- Study Plan Routes ---
app.get('/api/plans', auth, async (req, res) => {
    try {
        const plans = await StudyPlan.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(plans);
    } catch (error) {
        res.status(500).json({ msg: 'Server error fetching plans.' });
    }
});

app.post('/api/generate-plan', auth, upload.single('pdf'), async (req, res) => {
    const { file } = req;
    const { startDate, endDate } = req.body;
    if (!file || !startDate || !endDate) return res.status(400).json({ msg: 'Missing required fields.' });

    try {
        const dataBuffer = fs.readFileSync(file.path);
        const pdfData = await pdf(dataBuffer);
        const pdfSummary = await summarizePdfText(pdfData.text);
        const aiResponseString = await getGroqStudyPlan(pdfSummary, startDate, endDate, file.originalname);

        if (!aiResponseString || typeof aiResponseString !== 'string') {
            throw new Error("AI service returned an invalid or empty response.");
        }
        
        let aiResponseJson;
        try {
            aiResponseJson = JSON.parse(aiResponseString);
        } catch (parseError) {
            console.error("Failed to parse JSON from AI response:", aiResponseString);
            throw new Error("The AI failed to generate a valid study plan in the correct format. Please try again.");
        }

        let aiSections = aiResponseJson.studyPlan;
        if (!aiSections || !Array.isArray(aiSections)) throw new Error("AI response was not in the expected format.");

        aiSections = aiSections.map((section, index) => ({ ...section, day: index + 1 }));

        const newPlan = new StudyPlan({
            userId: req.user.id,
            title: `${file.originalname.replace(/\.pdf$/i, '')}`,
            originalFileName: file.filename,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            sections: aiSections,
        });
        const savedPlan = await newPlan.save();
        res.status(201).json(savedPlan);
    } catch (error) {
        console.error('Error during plan generation:', error);
        res.status(500).json({ msg: 'Server error: ' + error.message });
    } finally {
        if (req.file && req.file.path) { fs.unlinkSync(req.file.path); }
    }
});

app.patch('/api/plan/:planId/section/:sectionId', auth, async (req, res) => {
    try {
        const { planId, sectionId } = req.params;
        const { status, notes } = req.body;

        const plan = await StudyPlan.findOne({_id: planId, userId: req.user.id});
        if (!plan) return res.status(404).json({ msg: 'Study plan not found.' });
        
        const section = plan.sections.id(sectionId);
        if (!section) return res.status(404).json({ msg: 'Section not found.' });

        if (status) section.status = status;
        if (notes !== undefined) section.notes = notes;

        await plan.save();
        res.status(200).json(section);
    } catch (error) {
        console.error('Error updating section:', error);
        res.status(500).json({ msg: 'Server error while updating section.' });
    }
});

app.post('/api/generate-flashcards', auth, async (req, res) => {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ msg: 'Topic is required.' });
    try {
        const flashcardsString = await getGroqFlashcards(topic);
        const flashcardsJson = JSON.parse(flashcardsString);

        const newSet = new FlashcardSet({
            userId: req.user.id,
            topic: topic,
            cards: flashcardsJson.flashcards
        });
        await newSet.save();
        res.status(201).json(newSet);
    } catch (error) {
        console.error('Error generating flashcards:', error);
        res.status(500).json({ msg: 'Server error: ' + error.message });
    }
});

// --- NEW FLASHCARD ROUTES ---
// GET all flashcard sets for the logged-in user
app.get('/api/flashcard-sets', auth, async (req, res) => {
    try {
        const sets = await FlashcardSet.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(sets);
    } catch (error) {
        console.error('Error fetching flashcard sets:', error);
        res.status(500).json({ msg: 'Server error fetching flashcard sets.' });
    }
});

// DELETE a specific flashcard set
app.delete('/api/flashcard-sets/:setId', auth, async (req, res) => {
    try {
        const { setId } = req.params;
        const set = await FlashcardSet.findOneAndDelete({ _id: setId, userId: req.user.id });

        if (!set) {
            return res.status(404).json({ msg: 'Flashcard set not found or user not authorized.' });
        }

        res.status(200).json({ msg: 'Flashcard set deleted successfully.' });
    } catch (error) {
        console.error('Error deleting flashcard set:', error);
        res.status(500).json({ msg: 'Server error deleting flashcard set.' });
    }
});

app.get('/api/plan/:planId', auth, async (req, res) => {
    try {
        const plan = await StudyPlan.findOne({ _id: req.params.planId, userId: req.user.id });
        if (!plan) return res.status(404).json({ msg: 'Plan not found.' });
        res.status(200).json(plan);
    } catch (error) {
        res.status(500).json({ msg: 'Server error fetching plan.' });
    }
});

app.delete('/api/plan/:planId', auth, async (req, res) => {
    try {
        const plan = await StudyPlan.findOneAndDelete({ _id: req.params.planId, userId: req.user.id });
        if (!plan) return res.status(404).json({ msg: 'Plan not found.' });
        await AssessmentResult.deleteMany({ planId: req.params.planId });
        res.status(200).json({ msg: 'Plan deleted successfully.' });
    } catch (error) {
        console.error("Error deleting plan:", error);
        res.status(500).json({ msg: 'Server error deleting plan.' });
    }
});

app.post('/api/generate-assessment', auth, async (req, res) => {
    const { topic, explanation } = req.body;
    if (!topic || !explanation) return res.status(400).json({ msg: 'Topic and explanation are required.' });
    try {
        const assessmentString = await getGroqAssessment(topic, explanation);
        const assessmentJson = JSON.parse(assessmentString);
        res.status(200).json(assessmentJson);
    } catch (error) {
        console.error('Error generating assessment:', error);
        res.status(500).json({ msg: 'Server error: ' + error.message });
    }
});

app.post('/api/submit-assessment', auth, async (req, res) => {
    const { planId, sectionId, answers, questions } = req.body;
    if (!planId || !sectionId || !answers || !questions) return res.status(400).json({ msg: 'Missing required fields.' });

    try {
        let score = 0;
        questions.forEach((q, index) => {
            if (q.correctAnswer.trim() === (answers[index] ? answers[index].trim() : "")) {
                score++;
            }
        });

        const result = new AssessmentResult({ planId, sectionId, score, totalQuestions: questions.length });
        await result.save();
        res.status(201).json({ score, totalQuestions: questions.length });
    } catch (error) {
        console.error('Error submitting assessment:', error);
        res.status(500).json({ msg: 'Server error: ' + error.message });
    }
});

app.get('/api/plan/:planId/section/:sectionId/download', auth, async (req, res) => {
    try {
        const { planId, sectionId } = req.params;
        const plan = await StudyPlan.findOne({ _id: planId, userId: req.user.id });
        if (!plan) return res.status(404).json({ msg: 'Study plan not found.' });
        const section = plan.sections.id(sectionId);
        if (!section) return res.status(404).json({ msg: 'Section not found.' });

        let fileContent = `STUDY PLAN - DAY ${section.day}\n`;
        fileContent += `=================================\n\n`;
        fileContent += `TOPIC: ${section.title}\n`;
        fileContent += `SUBJECT: ${section.topic}\n\n`;
        fileContent += `--- DETAILED EXPLANATION ---\n${section.explanation}\n\n`;
        fileContent += `--- KEY POINTS ---\n${section.keyPoints.map(p => `- ${p}`).join('\n')}\n\n`;
        fileContent += `--- MY NOTES ---\n${section.notes || 'No notes taken.'}\n\n`;
        fileContent += `--- PRACTICE QUESTIONS ---\n${section.questions.map((q, i) => `${i+1}. ${q}`).join('\n')}\n\n`;
        fileContent += `--- PREVIOUS YEAR QUESTIONS ---\n${section.pyqs.map((q, i) => `${i+1}. ${q}`).join('\n')}\n\n`;
        fileContent += `--- RESOURCES TO SEARCH ---\n`;
        fileContent += `Youtube Queries: \n${section.youtubeSearchQueries.map(l => `- ${l}`).join('\n')}\n`;
        fileContent += `Article Search Queries: \n${section.referralSearchQueries.map(l => `- ${l}`).join('\n')}\n`;

        const fileName = `Day_${section.day}_${section.title.replace(/\s/g, '_')}.txt`;
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', 'text/plain');
        res.send(fileContent);

    } catch (error) {
        console.error('Error generating download:', error);
        res.status(500).json({ msg: 'Server error while generating download.' });
    }
});

app.get('/api/analytics', auth, async (req, res) => {
    try {
        const results = await AssessmentResult.find().populate({
            path: 'planId',
            match: { userId: req.user.id }
        }).sort({ takenAt: -1 });
        res.status(200).json(results.filter(r => r.planId)); // Filter out results where plan doesn't belong to user
    } catch (error) {
        res.status(500).json({ msg: 'Server error fetching analytics data.' });
    }
});

app.get('/api/analytics/smart-review', auth, async (req, res) => {
    try {
        const recentResults = await AssessmentResult.find().populate({
            path: 'planId',
            match: { userId: req.user.id }
        }).sort({ takenAt: -1 }).limit(50);

        const topicsToReview = [];
        const reviewedSectionIds = new Set();

        for (const result of recentResults.filter(r => r.planId)) {
            if ((result.score / result.totalQuestions) < 0.7) {
                if (!reviewedSectionIds.has(result.sectionId.toString())) {
                    const section = result.planId.sections.id(result.sectionId);
                    if (section) {
                        topicsToReview.push({
                            planId: result.planId._id,
                            sectionId: section._id,
                            title: section.title,
                            planTitle: result.planId.title
                        });
                        reviewedSectionIds.add(result.sectionId.toString());
                    }
                }
            }
            if (topicsToReview.length >= 5) break;
        }
        res.status(200).json(topicsToReview);
    } catch (error) {
        console.error("Error fetching smart review data:", error);
        res.status(500).json({ msg: 'Server error fetching smart review data.' });
    }
});

app.post('/api/chat', auth, async (req, res) => {
    const { history } = req.body;
    if (!history) return res.status(400).json({ msg: 'Chat history is required.' });

    try {
        const stream = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful and friendly study assistant. Answer questions clearly and concisely.'
                },
                ...history
            ],
            model: 'llama3-70b-8192',
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
        console.error("Error with Groq chat stream:", error);
        if (!res.headersSent) {
            res.status(500).json({ msg: 'Error processing chat request.' });
        } else {
            res.end();
        }
    }
});

// --- Server Start ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});