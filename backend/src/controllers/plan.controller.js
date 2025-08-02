// src/controllers/plan.controller.js
const Plan = require('../models/plan.model');
const fs = require('fs');
const pdf = require('pdf-parse');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * A robust function to call the Groq API with automatic retries.
 * This handles transient errors and rate limits.
 * @param {string} prompt The prompt to send to the AI.
 * @param {number} dayNumber The day number for logging purposes.
 * @param {number} maxRetries The maximum number of times to retry.
 * @returns {Promise<object>} The parsed JSON content from the AI.
 */
const generateContentWithRetries = async (prompt, dayNumber, maxRetries = 3) => {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama3-8b-8192',
                response_format: { type: "json_object" },
            });
            const content = completion.choices[0].message.content;
            return JSON.parse(content); // Success
        } catch (error) {
            attempt++;
            console.error(`Error generating content for Day ${dayNumber} (Attempt ${attempt}/${maxRetries}):`, error.message);
            if (attempt >= maxRetries) {
                // If all retries fail, throw the error to be caught by the main handler
                throw error;
            }
            // Wait before retrying with exponential backoff (e.g., 2s, 4s, 8s)
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`Retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};


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

        const generatedSections = [];
        for (const [index, chunk] of textChunks.entries()) {
            const dayNumber = index + 1;
            console.log(`Generating content for Day ${dayNumber}...`);
            
            // --- FIX: A more forceful and structured prompt ---
            const prompt = `
                You are an expert author tasked with writing a study guide chapter for Day ${dayNumber}.

                **NON-NEGOTIABLE CONSTRAINTS:**
                1.  **Identify Topic:** First, identify the core topic from the text segment below.
                2.  **Generate Long-Form Content:** Write a comprehensive, detailed chapter about this topic.
                3.  **MANDATORY LENGTH:** The "explanation" field **MUST** be a minimum of 1000 words. A short summary is a failure. To meet this length, you **MUST** structure your chapter with the following markdown headings: "## Introduction", "## Core Principle 1: [Name of Principle]", "## Core Principle 2: [Name of Principle]", "## Practical Applications", and "## Conclusion". Flesh out each section thoroughly.

                **OUTPUT FORMAT:**
                After authoring the chapter, provide your response as a single, valid JSON object with these exact keys:
                - "day": ${dayNumber}
                - "title": (string) A short, catchy title for the study chapter.
                - "topic": (string) The main topic you identified.
                - "explanation": (string) The full 1000+ word study chapter you wrote, complete with markdown headings.
                - "keyPoints": (array of strings) At least 10 distinct key points summarizing the chapter.
                - "youtubeSearchQueries": (array of strings) 4 effective YouTube search queries for the topic.
                - "referralSearchQueries": (array of strings) 4 effective Google search queries for the topic.
                - "questions": (array of strings) 5 thought-provoking questions based on the chapter.
                - "pyqs": (array of strings) 5 exam-style "Previous Year Questions" (PYQs) related to the topic.

                **TEXT SEGMENT:**
                "${chunk}"
            `;
            
            const fallbackSection = {
                day: dayNumber,
                title: `Topic for Day ${dayNumber}`,
                topic: "Content Generation Failed",
                explanation: "There was an error generating the detailed explanation for this topic after multiple attempts. Please try generating the plan again.",
                keyPoints: [], youtubeSearchQueries: [], referralSearchQueries: [], questions: [], pyqs: []
            };

            try {
                const parsedContent = await generateContentWithRetries(prompt, dayNumber);
                if (!parsedContent.explanation || !parsedContent.title || !parsedContent.topic) {
                    console.error(`Validation failed for Day ${dayNumber}: AI response was missing required fields.`);
                    generatedSections.push(fallbackSection);
                } else {
                    generatedSections.push(parsedContent);
                }
            } catch (e) {
                console.error(`Final failure to generate content for Day ${dayNumber}.`);
                generatedSections.push(fallbackSection);
            }
        }

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
