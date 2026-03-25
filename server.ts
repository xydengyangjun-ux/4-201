import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- SERVER STARTING ---');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      nodeVersion: process.version,
      env: process.env.NODE_ENV || 'development',
      fetchAvailable: typeof fetch !== 'undefined',
      abortControllerAvailable: typeof AbortController !== 'undefined'
    });
  });

  // DeepSeek Proxy Endpoint
  app.post('/api/chat', async (req, res) => {
    const rawKey = process.env.DEEPSEEK_API_KEY;
    const apiKey = (rawKey && rawKey.trim() !== '') 
      ? rawKey 
      : 'sk-eb65e011c69a4e1cb667eecdfce990a8';
    
    console.log('API Key source:', rawKey ? 'Environment' : 'Fallback');
    console.log('API Key length:', apiKey?.length);

    console.log('Proxying request to DeepSeek. Messages count:', req.body.messages?.length);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // Increased to 45s

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(req.body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      console.log('DeepSeek response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek error status:', response.status);
        console.error('DeepSeek error body:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          return res.status(response.status).json(errorData);
        } catch (e) {
          return res.status(response.status).json({ 
            error: { message: `DeepSeek API Error (${response.status}): ${errorText}` } 
          });
        }
      }

      const data = await response.json();
      console.log('DeepSeek response data received successfully');
      res.json(data);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('DeepSeek Proxy Error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        error: { message: `Proxy Error: ${message}` } 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
