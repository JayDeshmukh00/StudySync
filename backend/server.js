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

// Load environment variables from a .env file
require('dotenv').config();

// --- Server Configuration ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- Groq AI Client ---
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Database Connection ---
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => { console.error('Connection error', err); process.exit(1); });

// --- Database Schemas and Models ---
const sectionSchema = new mongoose.Schema({
  day: Number,
  title: String,
  topic: String,
  explanation: String,
  keyPoints: [String],
  youtubeLinks: [String],
  referralLinks: [String],
  questions: [String],
  pyqs: [String],
  status: { type: String, default: 'pending' },
  notes: { type: String, default: '' }
});

const studyPlanSchema = new mongoose.Schema({
  title: { type: String, required: true },
  originalFileName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  sections: [sectionSchema],
  createdAt: { type: Date, default: Date.now }
});

const assessmentResultSchema = new mongoose.Schema({
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan', required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    takenAt: { type: Date, default: Date.now }
});

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);
const AssessmentResult = mongoose.model('AssessmentResult', assessmentResultSchema);

// --- File Upload Handling (Multer) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- AI Helper Functions ---
async function getGroqStudyPlan(pdfText, startDate, endDate, fileName) {
  console.log('Sending request to Groq API for study plan...');
  const prompt = `
    You are an expert learning assistant. Your task is to create a comprehensive, detailed, day-by-day study plan from ${startDate} to ${endDate}, based on the provided text from a book titled "${fileName}".
    For each day, you MUST provide a rich and helpful set of resources.
    - The "explanation" must be very detailed, at least 4-5 paragraphs long, breaking down the core concepts for the day in an easy-to-understand manner.
    - The "keyPoints" must be a bulleted list of at least 7-8 crucial takeaways from the topic.
    - For "youtubeLinks" and "referralLinks", you must act as a web researcher. Find and provide at least 2-3 REAL, VALID, and highly RELEVANT URLs for each. The links must be directly related to the day's topic. Do not invent links.
    - For "questions" and "pyqs", generate at least 4-5 challenging questions for each category to test deep understanding.

    The output MUST be a valid JSON object with a single key "studyPlan" which is an array of objects.
    Each object in the array represents a single day's plan and must have the exact following structure:
    {
      "day": <An integer for the sequential day number, e.g., 1>,
      "title": "<A concise title for the day's topic>",
      "topic": "<The specific chapter or subject to cover>",
      "explanation": "<A very detailed, multi-paragraph explanation of the topic.>",
      "keyPoints": ["<An array of at least 7-8 important key points>"],
      "youtubeLinks": ["<An array of 2-3 real, valid YouTube video URLs>"],
      "referralLinks": ["<An array of 2-3 real, valid article or resource URLs>"],
      "questions": ["<An array of 4-5 important questions to practice>"],
      "pyqs": ["<An array of 4-5 previous year questions, if applicable>"]
    }
    ---
    PDF TEXT CONTENT (first 20,000 characters):
    ${pdfText.substring(0, 20000)} 
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

// --- API Routes ---

app.get('/api/plans', async (req, res) => {
    try {
        const plans = await StudyPlan.find().sort({ createdAt: -1 });
        res.status(200).json(plans);
    } catch (error) {
        res.status(500).json({ msg: 'Server error fetching plans.' });
    }
});

app.get('/api/plan/:planId', async (req, res) => {
    try {
        const plan = await StudyPlan.findById(req.params.planId);
        if (!plan) return res.status(404).json({ msg: 'Plan not found.' });
        res.status(200).json(plan);
    } catch (error) {
        res.status(500).json({ msg: 'Server error fetching plan.' });
    }
});

app.delete('/api/plan/:planId', async (req, res) => {
    try {
        const plan = await StudyPlan.findByIdAndDelete(req.params.planId);
        if (!plan) return res.status(404).json({ msg: 'Plan not found.' });
        // Also delete associated assessment results
        await AssessmentResult.deleteMany({ planId: req.params.planId });
        res.status(200).json({ msg: 'Plan deleted successfully.' });
    } catch (error) {
        console.error("Error deleting plan:", error);
        res.status(500).json({ msg: 'Server error deleting plan.' });
    }
});


app.post('/api/generate-plan', upload.single('pdf'), async (req, res) => {
  const { file } = req;
  const { startDate, endDate } = req.body;
  if (!file || !startDate || !endDate) return res.status(400).json({ msg: 'Missing required fields.' });

  try {
    const dataBuffer = fs.readFileSync(file.path);
    const pdfData = await pdf(dataBuffer);
    const aiResponseString = await getGroqStudyPlan(pdfData.text, startDate, endDate, file.originalname);
    const aiResponseJson = JSON.parse(aiResponseString);
    let aiSections = aiResponseJson.studyPlan;
    if (!aiSections || !Array.isArray(aiSections)) throw new Error("AI response was not in the expected format.");

    aiSections = aiSections.map((section, index) => ({ ...section, day: index + 1 }));

    const newPlan = new StudyPlan({
      title: `${file.originalname.replace('.pdf', '')}`,
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

app.patch('/api/plan/:planId/section/:sectionId', async (req, res) => {
    try {
        const { planId, sectionId } = req.params;
        const { status, notes } = req.body;

        const plan = await StudyPlan.findById(planId);
        if (!plan) return res.status(404).json({ msg: 'Study plan not found.' });
        const section = plan.sections.id(sectionId);
        if (!section) return res.status(404).json({ msg: 'Section not found.' });

        if (status) {
            section.status = status;
        }
        if (notes !== undefined) {
            section.notes = notes;
        }

        await plan.save();
        res.status(200).json(plan);
    } catch (error) {
        console.error('Error updating section:', error);
        res.status(500).json({ msg: 'Server error while updating section.' });
    }
});

app.post('/api/generate-assessment', async (req, res) => {
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

app.post('/api/submit-assessment', async (req, res) => {
    const { planId, sectionId, answers, questions } = req.body;
    if (!planId || !sectionId || !answers || !questions) return res.status(400).json({ msg: 'Missing required fields.' });

    try {
        let score = 0;
        questions.forEach((q, index) => {
            const correctAnswer = q.correctAnswer.trim();
            const userAnswer = answers[index] ? answers[index].trim() : "";
            if (correctAnswer === userAnswer) {
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

app.get('/api/plan/:planId/section/:sectionId/download', async (req, res) => {
    try {
        const { planId, sectionId } = req.params;
        const plan = await StudyPlan.findById(planId);
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
        fileContent += `--- RESOURCES ---\n`;
        fileContent += `YouTube: \n${section.youtubeLinks.map(l => `- ${l}`).join('\n')}\n`;
        fileContent += `Articles: \n${section.referralLinks.map(l => `- ${l}`).join('\n')}\n`;

        const fileName = `Day_${section.day}_${section.title.replace(/\s/g, '_')}.txt`;
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', 'text/plain');
        res.send(fileContent);

    } catch (error) {
        console.error('Error generating download:', error);
        res.status(500).json({ msg: 'Server error while generating download.' });
    }
});

app.get('/api/analytics', async (req, res) => {
    try {
        const results = await AssessmentResult.find().populate('planId', 'title');
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ msg: 'Server error fetching analytics data.' });
    }
});

app.post('/api/chat', async (req, res) => {
    const { history } = req.body;
    if (!history) return res.status(400).json({ msg: 'Chat history is required.' });

    try {
        const stream = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful and friendly study assistant. Answer questions clearly and concisely. You can explain concepts, provide summaries, or help with study-related queries.'
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
        res.status(500).json({ msg: 'Error processing chat request.' });
    }
});


// --- Create Uploads Directory & Start Server ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log(`Created directory: ${uploadsDir}`);
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
