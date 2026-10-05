interface VercelRequest {
  method?: string;
  body?: any;
  headers?: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  setHeader(name: string, value: string): void;
  status(code: number): {
    json(body: any): void;
    end(): void;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Only POST requests are accepted.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Server configuration error: GEMINI_API_KEY environment variable is missing on Vercel.'
      });
    }

    const { model = 'gemini-2.5-flash', contents, config, systemInstruction } = req.body || {};

    if (!contents) {
      return res.status(400).json({ error: 'Invalid request body: "contents" field is required.' });
    }

    // Standard Gemini v1beta API endpoint
    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    // Construct standard payload for Gemini REST API
    const requestPayload: any = {
      contents: Array.isArray(contents) ? contents : [{ parts: typeof contents === 'string' ? [{ text: contents }] : [contents] }]
    };

    if (config) {
      if (config.tools) {
        requestPayload.tools = config.tools;
      }
      
      const generationConfig: any = {};
      if (config.responseMimeType) generationConfig.responseMimeType = config.responseMimeType;
      if (config.responseSchema) generationConfig.responseSchema = config.responseSchema;
      if (config.responseModalities) generationConfig.responseModalities = config.responseModalities;
      if (config.speechConfig) generationConfig.speechConfig = config.speechConfig;
      if (config.temperature !== undefined) generationConfig.temperature = config.temperature;

      if (Object.keys(generationConfig).length > 0) {
        requestPayload.generationConfig = generationConfig;
      }
    }

    if (systemInstruction) {
      requestPayload.systemInstruction = typeof systemInstruction === 'string'
        ? { parts: [{ text: systemInstruction }] }
        : systemInstruction;
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Gemini API call failed with HTTP status ${response.status}`,
        details: errorText,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('Error proxying Gemini API request:', err);
    return res.status(500).json({
      error: 'An internal server error occurred while contacting the Gemini API.',
      message: err?.message || String(err),
    });
  }
}
