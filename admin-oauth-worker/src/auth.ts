export type AuthorizeConfig = {
  clientId: string;
  scope?: string;
};

export const OAUTH_STATE_COOKIE = 'decap_oauth_state';

export function parseAllowedUsers(value = ''): Set<string> {
  return new Set(
    value
      .split(',')
      .map((user) => user.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAllowedUser(login: string, allowedUsers: string): boolean {
  return parseAllowedUsers(allowedUsers).has(login.trim().toLowerCase());
}

function randomHex(bytes: number): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function buildAuthorizeUrl(requestUrl: URL, config: AuthorizeConfig): URL {
  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', config.clientId);
  authorizeUrl.searchParams.set('redirect_uri', `${requestUrl.origin}/callback?provider=github`);
  authorizeUrl.searchParams.set('scope', config.scope ?? 'public_repo,user');
  authorizeUrl.searchParams.set('state', randomHex(8));
  return authorizeUrl;
}

export function buildStateCookie(state: string): string {
  return `${OAUTH_STATE_COOKIE}=${encodeURIComponent(state)}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export function readCookieValue(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join('='));
    }
  }

  return undefined;
}

export function buildCallbackHtml(status: 'success' | 'error', payload: Record<string, string>): string {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Authorizing Decap CMS</title>
  </head>
  <body>
    <p>Authorizing Decap CMS...</p>
    <script>
      window.opener.postMessage(${JSON.stringify(message)}, "*");
      window.close();
    </script>
  </body>
</html>`;
}
