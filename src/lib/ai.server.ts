export type AIProvider = 'gemini' | 'openai';

export type AIContentPart =
  | { type: 'text'; text: string }
  | { type: 'image'; dataUrl: string };

export type StructuredAIOptions = {
  system: string;
  userPrompt?: string;
  parts?: AIContentPart[];
  schema?: object;
  schemaName?: string;
};

export function getAIProvider(): AIProvider | null {
  if (process.env['GEMINI_API_KEY'] || process.env['VITE_GEMINI_API_KEY']) return 'gemini';
  if (process.env['OPENAI_API_KEY']) return 'openai';
  return null;
}

/**
 * Call Gemini 2.5 Flash / 1.5 Flash using the Google Generative Language API.
 * Supports system instruction, multimodal images (base64 inlineData), and JSON mode.
 */
async function callGemini(apiKey: string, options: StructuredAIOptions): Promise<string> {
  // Prefer gemini-2.5-flash or gemini-1.5-flash
  const model = process.env['GEMINI_MODEL'] || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contentsParts: Array<Record<string, unknown>> = [];

  if (options.userPrompt) {
    contentsParts.push({ text: options.userPrompt });
  }

  if (options.parts) {
    for (const part of options.parts) {
      if (part.type === 'text') {
        contentsParts.push({ text: part.text });
      } else if (part.type === 'image') {
        const matches = part.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches[1] && matches[2]) {
          contentsParts.push({
            inline_data: {
              mime_type: matches[1],
              data: matches[2],
            },
          });
        }
      }
    }
  }

  const payload: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: contentsParts.length > 0 ? contentsParts : [{ text: 'Please execute the requested task.' }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  };

  if (options.system) {
    payload['system_instruction'] = {
      parts: [{ text: options.system }],
    };
  }

  const candidateModels = [
    process.env['GEMINI_MODEL'],
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-1.5-flash',
  ].filter(Boolean) as string[];

  let lastError = '';

  for (const model of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        lastError = `[${model}] (${res.status}): ${errorBody.slice(0, 200)}`;
        console.warn(`[Gemini] ${model} returned ${res.status}, trying next model...`);
        continue;
      }

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        error?: { message?: string };
      };

      if (data.error) {
        lastError = data.error.message || 'Unknown error';
        console.warn(`[Gemini] ${model} error: ${lastError}, trying next model...`);
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini] ${model} fetch exception: ${lastError}, trying next model...`);
    }
  }

  throw new Error(`Gemini API request failed across candidate models: ${lastError}`);
}

/**
 * Call OpenAI-compatible endpoints with responses/chat completions.
 */
async function callOpenAICompatible(url: string, headers: Record<string, string>, model: string, options: StructuredAIOptions): Promise<string> {
  const contentList: Array<Record<string, unknown>> = [];
  if (options.userPrompt) {
    contentList.push({ type: 'text', text: options.userPrompt });
  }
  if (options.parts) {
    for (const part of options.parts) {
      if (part.type === 'text') {
        contentList.push({ type: 'text', text: part.text });
      } else if (part.type === 'image') {
        contentList.push({ type: 'image_url', image_url: { url: part.dataUrl } });
      }
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      stream: false,
      store: false,
      messages: [
        { role: 'system', content: options.system },
        { role: 'user', content: contentList },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`AI request failed (${res.status}): ${errorBody.slice(0, 250)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new Error('AI returned an empty response.');
  return text;
}

/**
 * Universal JSON-structured AI caller. Supports GEMINI_API_KEY and OPENAI_API_KEY.
 */
export async function runStructuredAI<T>(options: StructuredAIOptions): Promise<T> {
  const geminiKey = process.env['GEMINI_API_KEY'] || process.env['VITE_GEMINI_API_KEY'];
  const openaiKey = process.env['OPENAI_API_KEY'];

  let rawJson = '';

  if (geminiKey) {
    rawJson = await callGemini(geminiKey, options);
  } else if (openaiKey) {
    rawJson = await callOpenAICompatible(
      'https://api.openai.com/v1/chat/completions',
      { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      process.env['OPENAI_MODEL'] || 'gpt-4o',
      options,
    );
  } else {
    throw new Error('AI is not configured. Please set GEMINI_API_KEY in your .env file to enable Gemini AI.');
  }

  // Strip Markdown code fencing if returned by model
  let cleaned = rawJson.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Failed to parse AI output as JSON: ${cleaned.slice(0, 200)}`);
  }
}
