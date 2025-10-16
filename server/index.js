require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const multer = require('multer');

// 配置文件上传
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 提供静态文件服务（前端文件）
app.use(express.static(path.join(__dirname, '../')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use('/pages', express.static(path.join(__dirname, '../pages')));

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

// 图片代理接口 - 用于转发 Figma 图片请求
app.get('/api/proxy-image', async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).send('Missing url parameter');
        }
        
        // 验证是否为 Figma 图片 URL
        if (!url.startsWith('https://www.figma.com/api/mcp/asset/')) {
            return res.status(403).send('Only Figma images are allowed');
        }
        
        console.log(`[server] 代理图片: ${url.substring(0, 80)}...`);
        
        // 发起请求获取图片
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Referer': 'https://www.figma.com/',
            },
            timeout: 10000
        });
        
        // 设置响应头
        const contentType = response.headers['content-type'] || 'image/png';
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400'); // 缓存24小时
        
        // 返回图片数据
        res.send(response.data);
        
    } catch (error) {
        console.error('[server] 图片代理失败:', error.message);
        res.status(error.response?.status || 500).send('Failed to proxy image');
    }
});

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

// 处理图片生成请求（用于注册流程）
app.post('/api/generate-image', upload.single('image'), async (req, res) => {
    try {
        const { role, talent, talentDesc } = req.body || {};
        
        if (!role || !talent || !talentDesc) {
            return res.status(400).json({ 
                message: 'role, talent, and talentDesc are required' 
            });
        }

        // 构建 prompt - 使用专业的 Chibi 风格提示词
        const basePrompt = `A cute chibi anime full body character with extremely thick black border, solid flat colors without any shading or gradients, large head small body (1:1.5 ratio), vector art style, kawaii aesthetic, simple geometric shapes, transparent background, high contrast, vibrant colors, simplified details, clean design, no texture, no complex elements, isolated on transparent background`;
        
        const characterDetails = `Character: ${role}. Talent: ${talent}. Description: ${talentDesc}`;
        
        const prompt = `${basePrompt}. ${characterDetails}`;
        
        console.info('[server] 生成角色图片', {
            role,
            talent,
            talentDesc: talentDesc.substring(0, 50),
            promptLength: prompt.length
        });

        // 调用 Seedream API
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
            },
            timeout: 60000
        });

        const imageUrl = response.data?.data?.[0]?.url || null;
        
        if (!imageUrl) {
            throw new Error('No image URL returned from API');
        }

        res.json({ 
            imageUrls: [imageUrl],
            imageUrl 
        });
    } catch (error) {
        console.error('[server] 图片生成失败', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            code: error.code
        });
        res.status(error.response?.status || 500).json({
            message: 'Image generation failed',
            error: error.response?.data || error.message
        });
    }
});

// 根路径返回首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// 处理所有HTML页面路由（使用正则表达式）
app.get(/.*\.html$/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', req.path));
});

const PORT = process.env.PORT || 5176;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`[server] Proxy server running on ${HOST}:${PORT}`);
    console.log(`[server] Serving static files from: ${path.join(__dirname, '../')}`);
    console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`);
});
