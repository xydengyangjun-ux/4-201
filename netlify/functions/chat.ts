import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const rawKey = process.env.DEEPSEEK_API_KEY;
  const apiKey = (rawKey && rawKey.trim() !== '') 
    ? rawKey 
    : 'sk-eb65e011c69a4e1cb667eecdfce990a8';

  try {
    const body = JSON.parse(event.body || '{}');

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(body)
    });

    const data = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json'
      },
      body: data
    };
  } catch (error) {
    console.error('DeepSeek Proxy Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: { message: `Proxy Error: ${message}` } })
    };
  }
};
