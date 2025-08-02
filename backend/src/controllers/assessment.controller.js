
// src/controllers/assessment.controller.js
const AssessmentResult = require('../models/assessmentResult.model');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.generateAssessment = async (req, res) => {
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
};

exports.submitAssessment = async (req, res) => {
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
};
