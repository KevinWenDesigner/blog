export function buildYtDlpArgs(baseArgs: string[], url: string, cookiesPath?: string): string[] {
  const normalizedCookiesPath = cookiesPath?.trim();
  return normalizedCookiesPath
    ? [...baseArgs, '--cookies', normalizedCookiesPath, url]
    : [...baseArgs, url];
}

export function buildYtDlpMetadataArgs(url: string, cookiesPath?: string): string[] {
  return buildYtDlpArgs(
    ['--dump-single-json', '--skip-download', '--no-warnings', '--ignore-no-formats-error'],
    url,
    cookiesPath
  );
}
