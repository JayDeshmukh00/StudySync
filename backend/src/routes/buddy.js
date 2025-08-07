const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const languageDetails = {
    'en-US': { name: 'English', labels: { translation: 'Translation', explanation: 'Explanation' } },
    'hi-IN': { name: 'Hindi', labels: { translation: 'अनुवाद', explanation: 'व्याख्या' } },
    'gu-IN': { name: 'Gujarati', labels: { translation: 'અનુવાદ', explanation: 'સમજૂતી' } },
    // Add other languages as needed
};

const sanitizeAIResponse = (text, language) => {
    if (!text) return '';
    
    // Remove HTML tags, brackets, parentheses and their contents
    let cleanedText = text.replace(/<[^>]*>/g, '');
    cleanedText = cleanedText.replace(/\{[^}]*\}/g, '');
    cleanedText = cleanedText.replace(/\([^)]*\)/g, '');
    cleanedText = cleanedText.replace(/\[[^\]]*\]/g, '');
    
    // Remove any English characters and numbers for non-English languages
    if (language === 'hi-IN') {
        cleanedText = cleanedText.replace(/[a-zA-Z0-9]/g, '');
        cleanedText = cleanedText.replace(/[^\u0900-\u097F\s.,!?-]/g, '');
    } else if (language === 'gu-IN') {
        cleanedText = cleanedText.replace(/[a-zA-Z0-9]/g, '');
        cleanedText = cleanedText.replace(/[^\u0A80-\u0AFF\s.,!?-]/g, '');
    }
    
    // Clean up extra whitespace and unwanted characters
    cleanedText = cleanedText.replace(/[{}().]/g, '');
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    
    return cleanedText;
};

const getGroqCompletion = async (systemPrompt, userText) => {
    const chatCompletion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userText },
        ],
        model: 'llama3-70b-8192',
        temperature: 0.5,
    });
    return chatCompletion.choices[0]?.message?.content || '';
};

router.post('/explain', async (req, res) => {
    try {
        const { text, language } = req.body;
        const langInfo = languageDetails[language] || languageDetails['en-US'];
        const { name: languageName, labels } = langInfo;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // --- STEP 1: TRANSLATION ---
        const translationPrompt = `You are a professional translator. Translate this text into ${languageName}.

Rules:
- Write ONLY in ${languageName} script
- No English letters
- No parentheses or brackets
- No explanations or notes
- Just the direct translation

Text to translate:`;
        const rawTranslation = await getGroqCompletion(translationPrompt, text);

        // --- STEP 2: EXPLANATION IN TARGET LANGUAGE ---
        const explanationPrompt = `You are a friendly teacher. Explain the meaning of this text in simple ${languageName}.

Rules:
- Write ONLY in ${languageName} script
- No English letters anywhere
- Use simple, everyday words
- Be conversational like talking to a friend
- No technical terms

Text to explain:`;
        const rawExplanation = await getGroqCompletion(explanationPrompt, text);

        // --- Sanitize both responses ---
        const translation = sanitizeAIResponse(rawTranslation, language);
        const explanation = sanitizeAIResponse(rawExplanation, language);

        // --- Combine the results ---
        const finalResponse = `${labels.translation}: ${translation}\n\n${labels.explanation}: ${explanation}`;
        
        res.status(200).json({ explanation: finalResponse });

    } catch (error) {
        console.error("Error in /explain route:", error);
        res.status(500).json({ error: 'An error occurred while communicating with the AI.' });
    }
});

module.exports = router;