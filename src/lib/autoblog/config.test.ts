import { describe, expect, it } from 'vitest';

import { parseAutomationConfig } from './config';

describe('autoblog config', () => {
  it('accepts a valid channel configuration file', () => {
    const config = parseAutomationConfig(`{
      "categoryRules": [
        { "category": "工程化", "keywords": ["workflow", "pipeline"] }
      ],
      "channels": [
        {
          "channelId": "UC123",
          "label": "AI Notes",
          "defaultCategory": "读书",
          "includeKeywords": ["openai"],
          "excludeKeywords": ["podcast"],
          "defaultTags": ["AI", "YouTube"]
        }
      ]
    }`);

    expect(config.channels).toHaveLength(1);
    expect(config.categoryRules[0]?.category).toBe('工程化');
  });

  it('rejects duplicate channel ids and missing required arrays', () => {
    expect(() =>
      parseAutomationConfig(`{
        "categoryRules": [],
        "channels": [
          {
            "channelId": "UC123",
            "label": "AI Notes",
            "defaultCategory": "读书",
            "includeKeywords": ["openai"],
            "excludeKeywords": [],
            "defaultTags": ["AI"]
          },
          {
            "channelId": "UC123",
            "label": "Duplicate",
            "defaultCategory": "教程",
            "includeKeywords": ["guide"],
            "excludeKeywords": [],
            "defaultTags": ["Ops"]
          }
        ]
      }`)
    ).toThrow(/duplicate channelId/i);
  });
});
