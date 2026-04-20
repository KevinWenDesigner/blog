export function buildYtDlpArgs(baseArgs: string[], url: string, cookiesPath?: string): string[] {
  const normalizedCookiesPath = cookiesPath?.trim();
  return normalizedCookiesPath
    ? [...baseArgs, '--cookies', normalizedCookiesPath, url]
    : [...baseArgs, url];
}
