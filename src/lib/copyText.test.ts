import { describe, expect, it, vi } from 'vitest';

import { copyTextWithFallback } from './copyText';

describe('copyTextWithFallback', () => {
  it('uses navigator.clipboard.writeText when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const execCommand = vi.fn();
    const copied = await copyTextWithFallback('hello world', {
      clipboard: { writeText },
      document: { execCommand }
    });

    expect(copied).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello world');
    expect(execCommand).not.toHaveBeenCalled();
  });

  it('falls back to execCommand when clipboard access fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    const execCommand = vi.fn().mockReturnValue(true);
    const onBeforeExecCommand = vi.fn();
    const onAfterExecCommand = vi.fn();
    const copied = await copyTextWithFallback('hello world', {
      clipboard: { writeText },
      document: { execCommand },
      onBeforeExecCommand,
      onAfterExecCommand
    });

    expect(copied).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello world');
    expect(onBeforeExecCommand).toHaveBeenCalledTimes(1);
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(onAfterExecCommand).toHaveBeenCalledTimes(1);
  });

  it('returns false when both clipboard and fallback copy fail', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    const execCommand = vi.fn().mockReturnValue(false);
    const copied = await copyTextWithFallback('hello world', {
      clipboard: { writeText },
      document: { execCommand }
    });

    expect(copied).toBe(false);
  });
});
