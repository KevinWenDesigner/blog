import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('theme CSS configuration', () => {
  it('uses a class-based dark variant so the theme toggle can override system theme', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');

    expect(css).toContain('@custom-variant dark (&:where(.dark, .dark *));');
  });
});
