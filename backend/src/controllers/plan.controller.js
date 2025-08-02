// src/controllers/plan.controller.js
const Plan = require('../models/plan.model');
const fs = require('fs');
const pdf = require('pdf-parse');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.uploadAndGeneratePlan = async (req, res) => {
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
};

exports.getAllPlans = async (req, res) => {
    try {
        const plans = await Plan.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(plans);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.deletePlan = async (req, res) => {
    try {
        const result = await Plan.deleteOne({ _id: req.params.id, user: req.user.id });
        if (result.deletedCount === 0) return res.status(404).json({ msg: 'Plan not found' });
        res.json({ msg: 'Plan removed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.updateSection = async (req, res) => {
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
};

exports.downloadSection = async (req, res) => {
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
};

