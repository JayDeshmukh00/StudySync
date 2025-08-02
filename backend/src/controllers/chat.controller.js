
// src/controllers/chat.controller.js
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.streamChat = async (req, res) => {
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
};
