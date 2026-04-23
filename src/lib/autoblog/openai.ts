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

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<
      | {
          type: 'text';
          text?: string;
        }
      | {
          type: 'refusal';
          refusal?: string;
        }
    >;
  }>;
  error?: {
    message?: string;
  };
};

const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_TRANSCRIPT_CHARACTERS = 18_000;

export const AUTOBLOG_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string', minLength: 8 },
    description: { type: 'string', minLength: 12 },
    tags: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      minItems: 2,
      maxItems: 6
    },
    keywords: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      minItems: 2,
      maxItems: 8
    },
    summary: { type: 'string', minLength: 40 },
    keyPoints: {
      type: 'array',
      minItems: 3,
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          heading: { type: 'string', minLength: 4 },
          detail: { type: 'string', minLength: 12 },
          timestamp: { type: ['string', 'null'] }
        },
        required: ['heading', 'detail', 'timestamp']
      }
    },
    notableDetails: {
      type: 'array',
      items: { type: 'string', minLength: 6 },
      minItems: 1,
      maxItems: 5
    },
    actionAdvice: {
      type: 'array',
      items: { type: 'string', minLength: 6 },
      minItems: 1,
      maxItems: 4
    }
  },
  required: ['title', 'description', 'tags', 'keywords', 'summary', 'keyPoints', 'notableDetails', 'actionAdvice']
} as const;

function assertString(value: unknown, fieldName: string, minimumLength = 1): string {
  if (typeof value !== 'string') {
    throw new Error(`Expected ${fieldName} to be a string`);
  }

  const trimmed = value.trim();
  if (trimmed.length < minimumLength) {
    throw new Error(`Expected ${fieldName} to contain at least ${minimumLength} characters`);
  }

  return trimmed;
}

function normalizeStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Expected ${fieldName} to be an array`);
  }

  return [...new Set(value.map((item, index) => assertString(item, `${fieldName}[${index}]`)))];
}

function normalizeKeyPoints(value: unknown): GeneratedArticle['keyPoints'] {
  if (!Array.isArray(value)) {
    throw new Error('Expected keyPoints to be an array');
  }

  return value.map((item, index) => {
    const point = item as Record<string, unknown>;
    const timestamp =
      point.timestamp === undefined || point.timestamp === null
        ? undefined
        : assertString(point.timestamp, `keyPoints[${index}].timestamp`);

    return {
      heading: assertString(point.heading, `keyPoints[${index}].heading`, 4),
      detail: assertString(point.detail, `keyPoints[${index}].detail`, 12),
      ...(timestamp ? { timestamp } : {})
    };
  });
}

export function normalizeGeneratedArticle(value: unknown): GeneratedArticle {
  const article = value as Record<string, unknown>;

  return {
    title: assertString(article.title, 'title', 8),
    description: assertString(article.description, 'description', 12),
    tags: normalizeStringArray(article.tags, 'tags'),
    keywords: normalizeStringArray(article.keywords, 'keywords'),
    summary: assertString(article.summary, 'summary', 40),
    keyPoints: normalizeKeyPoints(article.keyPoints),
    notableDetails: normalizeStringArray(article.notableDetails, 'notableDetails'),
    actionAdvice: normalizeStringArray(article.actionAdvice, 'actionAdvice')
  };
}

export function buildAutoblogArticlePrompt({
  metadata,
  transcript
}: Omit<GenerateArticleInput, 'apiKey' | 'model'>): string {
  const clippedTranscript = transcript.slice(0, MAX_TRANSCRIPT_CHARACTERS);

  return [
    '请根据以下 YouTube 视频信息和可用内容，生成一篇适合发布到技术博客的中文结构化摘要。',
    '要求：',
    '- 只使用提供的内容，不要编造额外事实。',
    '- 如果可用内容说明字幕不可用，只能基于标题和描述做保守摘要。',
    '- 风格务实、具体，避免宣传语。',
    '- title 和 description 必须适合作为博客文章标题与摘要。',
    '- keyPoints 保持 3 到 5 条，每条聚焦一个可复用观点。',
    '- keyPoints 每条都必须包含 timestamp；若可用内容中能明确定位真实视频时间点，填写 mm:ss，否则填写 null。',
    '',
    `视频标题：${metadata.title}`,
    `频道：${metadata.channel}`,
    `视频链接：${metadata.url}`,
    `视频描述：${metadata.description || '（无）'}`,
    '',
    '可用内容：',
    clippedTranscript
  ].join('\n');
}

function readResponseText(response: OpenAIResponse): string {
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text;
  }

  for (const message of response.output ?? []) {
    for (const part of message.content ?? []) {
      if (part.type === 'refusal' && part.refusal) {
        throw new Error(`OpenAI refused the request: ${part.refusal}`);
      }

      if (part.type === 'text' && part.text?.trim()) {
        return part.text;
      }
    }
  }

  throw new Error(response.error?.message || 'OpenAI response did not contain structured text output');
}

export async function generateArticleWithOpenAI({
  apiKey,
  model = DEFAULT_MODEL,
  metadata,
  transcript
}: GenerateArticleInput): Promise<GeneratedArticle> {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      store: false,
      input: [
        {
          role: 'system',
          content:
            '你是一名技术编辑。你的任务是把公开视频字幕整理成适合工程博客发布的中文摘要，不夸大，不臆测。'
        },
        {
          role: 'user',
          content: buildAutoblogArticlePrompt({ metadata, transcript })
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'autoblog_article',
          strict: true,
          schema: AUTOBLOG_RESPONSE_SCHEMA
        }
      }
    })
  });

  const payload = (await response.json()) as OpenAIResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenAI request failed with status ${response.status}`);
  }

  return normalizeGeneratedArticle(JSON.parse(readResponseText(payload)));
}
