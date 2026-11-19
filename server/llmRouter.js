// server/llmRouter.js

async function generateNPCResponse(prompt) {
    // 1. Primary LLM: DeepSeek
    try {
        const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: "user", content: prompt }]
            })
        });

        if (!deepseekResponse.ok) throw new Error('DeepSeek API failed');
        const data = await deepseekResponse.json();
        return { provider: 'DeepSeek', text: data.choices[0].message.content };

    } catch (error) {
        console.warn('DeepSeek failed. Falling back to Gemini...', error.message);
        
        // 2. Fallback LLM: Gemini
        try {
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!geminiResponse.ok) throw new Error('Gemini API failed');
            const data = await geminiResponse.json();
            return { provider: 'Gemini', text: data.candidates[0].content.parts[0].text };

        } catch (geminiError) {
            console.error('Both DeepSeek and Gemini failed.');
            return { provider: 'None', text: "I'm having trouble thinking right now..." };
        }
    }
}

module.exports = { generateNPCResponse };
