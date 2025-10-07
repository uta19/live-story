require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

const GEMINI_API_KEY = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
const SEEDREAM_API_KEY = process.env.SEEDREAM_API_KEY;
const OPENROUTER_REFERER = process.env.OPENROUTER_REFERER || 'http://localhost';
const OPENROUTER_TITLE = process.env.OPENROUTER_TITLE || 'Aiko Mobile';

const SEEDREAM_ENDPOINT = process.env.SEEDREAM_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/images/generations';

if (!GEMINI_API_KEY) {
    console.warn('[server] 未设置 OPENROUTER_API_KEY 或 GEMINI_API_KEY 环境变量');
}
if (!SEEDREAM_API_KEY) {
    console.warn('[server] 未设置 SEEDREAM_API_KEY 环境变量');
}
if (!SEEDREAM_ENDPOINT) {
    console.warn('[server] 未设置 SEEDREAM_ENDPOINT 环境变量');
}

app.post('/api/gemini', async (req, res) => {
    try {
        const { systemPrompt = '', input = '' } = req.body || {};

        const payload = {
            model: 'google/gemini-2.5-pro',
            messages: [
                systemPrompt
                    ? {
                        role: 'system',
                        content: [{ type: 'text', text: systemPrompt }]
                    }
                    : null,
                {
                    role: 'user',
                    content: [{ type: 'text', text: input }]
                }
            ].filter(Boolean),
            stream: false
        };

        console.info('[server] Gemini 请求摘要', {
            systemPromptLength: systemPrompt?.length || 0,
            inputLength: input?.length || 0,
            payloadLength: JSON.stringify(payload).length
        });

        const response = await axios.post(OPENROUTER_ENDPOINT, payload, {
            headers: {
                Authorization: `Bearer ${GEMINI_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': OPENROUTER_REFERER,
                'X-Title': OPENROUTER_TITLE
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 60000
        });

        res.json(response.data);
    } catch (error) {
        console.error('[server] Gemini 代理失败', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(error.response?.status || 500).json({
            message: 'Gemini proxy failed',
            error: error.response?.data || error.message
        });
    }
});

app.post('/api/seedream', async (req, res) => {
    try {
        const { prompt } = req.body || {};
        if (!prompt) {
            return res.status(400).json({ message: 'prompt is required' });
        }

        const payload = {
            model: 'doubao-seedream-4-0-250828',
            prompt,
            response_format: 'url',
            size: '2K',
            watermark: true,
            sequential_image_generation: 'auto'
        };

        const response = await axios.post(SEEDREAM_ENDPOINT, payload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${SEEDREAM_API_KEY}`
            }
        });

        const imageUrl = response.data?.data?.[0]?.url || null;
        res.json({ imageUrl });
    } catch (error) {
        console.error('[server] Seedream 代理失败', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            code: error.code
        });
        res.status(error.response?.status || 500).json({
            message: 'Seedream proxy failed',
            error: error.response?.data || error.message
        });
    }
});

const PORT = process.env.PORT || 5176;
app.listen(PORT, () => {
    console.log(`[server] Proxy server running at http://localhost:${PORT}`);
});
