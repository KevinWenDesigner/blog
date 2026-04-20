import type { CategoryRule, ChannelConfig } from './discovery';

export type AutomationConfig = {
  categoryRules: CategoryRule[];
  channels: ChannelConfig[];
};

function assertString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Expected ${fieldName} to be a non-empty string`);
  }

  return value.trim();
}

function assertStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Expected ${fieldName} to be an array`);
  }

  return value.map((item, index) => assertString(item, `${fieldName}[${index}]`));
}

export function parseAutomationConfig(raw: string): AutomationConfig {
  const parsed = JSON.parse(raw) as {
    categoryRules?: unknown;
    channels?: unknown;
  };

  if (!Array.isArray(parsed.categoryRules)) {
    throw new Error('Expected categoryRules to be an array');
  }

  if (!Array.isArray(parsed.channels)) {
    throw new Error('Expected channels to be an array');
  }

  const categoryRules = parsed.categoryRules.map((rule, index) => {
    const value = rule as Record<string, unknown>;
    return {
      category: assertString(value.category, `categoryRules[${index}].category`),
      keywords: assertStringArray(value.keywords, `categoryRules[${index}].keywords`)
    };
  });

  const channels = parsed.channels.map((channel, index) => {
    const value = channel as Record<string, unknown>;
    return {
      channelId: assertString(value.channelId, `channels[${index}].channelId`),
      label: assertString(value.label, `channels[${index}].label`),
      defaultCategory: assertString(value.defaultCategory, `channels[${index}].defaultCategory`),
      includeKeywords: assertStringArray(value.includeKeywords, `channels[${index}].includeKeywords`),
      excludeKeywords: assertStringArray(value.excludeKeywords, `channels[${index}].excludeKeywords`),
      defaultTags: assertStringArray(value.defaultTags, `channels[${index}].defaultTags`)
    };
  });

  const duplicate = channels.find((channel, index) =>
    channels.findIndex((candidate) => candidate.channelId === channel.channelId) !== index
  );
  if (duplicate) {
    throw new Error(`Found duplicate channelId: ${duplicate.channelId}`);
  }

  return { categoryRules, channels };
}
