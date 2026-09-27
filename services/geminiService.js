/**
 * Gemini 2.0 Flash API Service
 * Handles image submission and MCQ answer extraction
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const MCQ_PROMPT = `You are an expert MCQ solver. Analyze the image carefully.

Your task:
1. Extract the MCQ question from the image
2. Identify all answer options (A, B, C, D or 1, 2, 3, 4)
3. Determine the correct answer
4. Provide a brief reason

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
  "reason": "brief explanation"
}

If no MCQ is visible, respond: {"error": "No MCQ detected in image"}`;

/**
 * Sends a base64 image to Gemini 2.0 Flash and extracts MCQ answer
 * @param {string} base64Image - Base64 encoded image (without data: prefix)
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<Object>} Parsed MCQ result
 */
export async function analyzeMCQFromImage(base64Image, apiKey) {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API key is required');
  }

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
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
  };

  const response = await fetch(`${GEMINI_API_BASE}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Gemini API error: ${errorMsg}`);
  }

  const data = await response.json();

  // Extract text from Gemini response
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty response from Gemini');
  }

  // Parse JSON from response (handle markdown code blocks)
  const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
    rawText.match(/```\s*([\s\S]*?)\s*```/) ||
    rawText.match(/(\{[\s\S]*\})/);

  if (!jsonMatch) {
    throw new Error('Could not parse Gemini response as JSON');
  }

  const parsed = JSON.parse(jsonMatch[1]);
  return parsed;
}
