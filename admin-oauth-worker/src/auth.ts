export type AuthorizeConfig = {
  clientId: string;
  scope?: string;
  stateSecret: string;
};

const STATE_MAX_AGE_MS = 10 * 60 * 1000;
const STATE_CLOCK_SKEW_MS = 60 * 1000;

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

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signState(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return base64UrlEncode(signature);
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}

export async function createSignedState(secret: string, now = Date.now()): Promise<string> {
  const payload = `${now}.${randomHex(8)}`;
  const signature = await signState(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifySignedState(
  state: string,
  secret: string,
  now = Date.now(),
  maxAgeMs = STATE_MAX_AGE_MS
): Promise<boolean> {
  const parts = state.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [rawTimestamp, nonce, signature] = parts;
  const timestamp = Number(rawTimestamp);
  if (!Number.isFinite(timestamp) || !nonce || !signature) {
    return false;
  }

  if (timestamp > now + STATE_CLOCK_SKEW_MS || now - timestamp > maxAgeMs) {
    return false;
  }

  const expectedSignature = await signState(`${rawTimestamp}.${nonce}`, secret);
  return constantTimeEqual(signature, expectedSignature);
}

export async function buildAuthorizeUrl(requestUrl: URL, config: AuthorizeConfig): Promise<URL> {
  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', config.clientId);
  authorizeUrl.searchParams.set('redirect_uri', `${requestUrl.origin}/callback?provider=github`);
  authorizeUrl.searchParams.set('scope', config.scope ?? 'public_repo,user');
  authorizeUrl.searchParams.set('state', await createSignedState(config.stateSecret));
  return authorizeUrl;
}

export function buildCallbackHtml(status: 'success' | 'error', payload: Record<string, string>): string {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  const fallbackText =
    status === 'success'
      ? 'Authorization complete. You can close this window and return to Decap CMS.'
      : `Authorization failed: ${payload.error || 'GitHub OAuth failed'}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Authorizing Decap CMS</title>
  </head>
  <body>
    <p id="status">Authorizing Decap CMS...</p>
    <script>
      const message = ${JSON.stringify(message)};
      const fallbackText = ${JSON.stringify(fallbackText)};
      if (window.opener && typeof window.opener.postMessage === "function") {
        const receiveMessage = () => {
          window.opener.postMessage(message, "*");
          window.removeEventListener("message", receiveMessage, false);
          window.close();
        };
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:github", "*");
      } else {
        document.getElementById("status").textContent = fallbackText;
      }
    </script>
  </body>
</html>`;
}
