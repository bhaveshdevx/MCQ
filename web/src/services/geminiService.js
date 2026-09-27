/**
 * Gemini Vision API Service (Web)
 * Sends an image to Gemini 2.0 Flash and extracts MCQ answers
 */

const GEMINI_API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models';

const MCQ_PROMPT = `You are an expert MCQ solver. Analyze the image carefully.

Your task:
1. Extract the MCQ question from the image
2. Identify all answer options (A, B, C, D or 1, 2, 3, 4)
3. Determine the correct answer
4. Provide a brief reason
5. Estimate your confidence level (0-100)

Respond ONLY in this exact JSON format:
{
  "question": "the question text here",
  "options": [
    {"label": "A", "text": "option text"},
    {"label": "B", "text": "option text"},
    {"label": "C", "text": "option text"},
    {"label": "D", "text": "option text"}
  ],
  "correctAnswer": "A",
  "reason": "brief but informative explanation",
  "confidence": 95
}

If no MCQ is visible, respond: {"error": "No MCQ detected in image"}`;

/**
 * Converts a data URL to a base64 string (strips the header)
 */
export function dataURLToBase64(dataURL) {
  return dataURL.split(',')[1];
}

/**
 * Analyzes an MCQ from a base64 image using Gemini API
 * @param {string} base64Image - Base64 encoded image (without data: prefix)
 * @param {string} apiKey - Gemini API key
 * @param {object} options - { model, temperature }
 * @returns {Promise<Object>} Parsed MCQ result
 */
export async function analyzeMCQFromImage(base64Image, apiKey, options = {}) {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API key is required. Please enter your Gemini API key in settings.');
  }

  const model = options.model || 'gemini-3.8-flash';
  const temperature = options.temperature ?? 0.1;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: MCQ_PROMPT,
          },
        ],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: 1024,
    },
  };

  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Gemini API error: ${errorMsg}`);
  }

  const data = await response.json();

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Gemini API');

  // Strip markdown code fences if present
  const jsonMatch =
    rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
    rawText.match(/```\s*([\s\S]*?)\s*```/) ||
    rawText.match(/(\{[\s\S]*\})/);

  if (!jsonMatch) throw new Error('Could not parse Gemini response as JSON');

  const parsed = JSON.parse(jsonMatch[1]);
  if (parsed.error) throw new Error(parsed.error);

  return parsed;
}
