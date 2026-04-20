import { describe, expect, it } from 'vitest';

import { buildYtDlpArgs, buildYtDlpMetadataArgs } from './ytDlp';

describe('yt-dlp helpers', () => {
  it('adds the cookies file when a path is configured', () => {
    expect(buildYtDlpArgs(['--dump-single-json', '--skip-download'], 'https://youtu.be/abc', '/tmp/cookies.txt')).toEqual([
      '--dump-single-json',
      '--skip-download',
      '--cookies',
      '/tmp/cookies.txt',
      'https://youtu.be/abc'
    ]);
  });

  it('omits cookies when no path is configured', () => {
    expect(buildYtDlpArgs(['--dump-json'], 'https://youtu.be/abc', '  ')).toEqual([
      '--dump-json',
      'https://youtu.be/abc'
    ]);
  });

  it('builds metadata args that do not fail when video formats are unavailable', () => {
    expect(buildYtDlpMetadataArgs('https://youtu.be/abc', '/tmp/cookies.txt')).toEqual([
      '--dump-single-json',
      '--skip-download',
      '--no-warnings',
      '--ignore-no-formats-error',
      '--cookies',
      '/tmp/cookies.txt',
      'https://youtu.be/abc'
    ]);
  });
});
