import {
  AUTOBLOG_RESPONSE_SCHEMA,
  buildAutoblogArticlePrompt,
  normalizeGeneratedArticle
} from './openai';
import type { GeneratedArticle } from './render';

type GenerateArticleInput = {
  apiKey: string;
  model?: string;
  metadata: {
    title: string;
    description: string;
    channel: string;
    url: string;
  };
  transcript: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

const DEFAULT_MODEL = 'gemini-2.5-flash';

function readGeminiResponseText(response: GeminiResponse): string {
  for (const candidate of response.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.text?.trim()) {
        return part.text;
      }
    }
  }

  throw new Error(response.error?.message || 'Gemini response did not contain structured text output');
}

export async function generateArticleWithGemini({
  apiKey,
  model = DEFAULT_MODEL,
  metadata,
  transcript
}: GenerateArticleInput): Promise<GeneratedArticle> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: buildAutoblogArticlePrompt({ metadata, transcript })
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: AUTOBLOG_RESPONSE_SCHEMA
        }
      })
    }
  );

  const payload = (await response.json()) as GeminiResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message || `Gemini request failed with status ${response.status}`);
  }

  return normalizeGeneratedArticle(JSON.parse(readGeminiResponseText(payload)));
}
