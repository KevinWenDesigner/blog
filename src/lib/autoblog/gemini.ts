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
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';

class GeminiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'GeminiRequestError';
  }
}

function isTemporaryGeminiError(error: unknown): boolean {
  if (!(error instanceof GeminiRequestError)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    error.status === 429 ||
    error.status === 503 ||
    message.includes('high demand') ||
    message.includes('try again later') ||
    message.includes('temporarily')
  );
}

function buildModelAttempts(model: string): string[] {
  return Array.from(new Set([model, FALLBACK_MODEL]));
}

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

async function requestGeminiArticle({
  apiKey,
  model,
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
    throw new GeminiRequestError(payload.error?.message || `Gemini request failed with status ${response.status}`, response.status);
  }

  return normalizeGeneratedArticle(JSON.parse(readGeminiResponseText(payload)));
}

export async function generateArticleWithGemini({
  model = DEFAULT_MODEL,
  ...input
}: GenerateArticleInput): Promise<GeneratedArticle> {
  let lastError: unknown = null;

  for (const modelAttempt of buildModelAttempts(model)) {
    try {
      return await requestGeminiArticle({ ...input, model: modelAttempt });
    } catch (error) {
      lastError = error;
      if (!isTemporaryGeminiError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}
