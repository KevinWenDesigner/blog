import { buildAuthorizeUrl, buildCallbackHtml, isAllowedUser, verifySignedState } from './auth';

type Env = {
  GITHUB_OAUTH_ID: string;
  GITHUB_OAUTH_SECRET: string;
  ALLOWED_GITHUB_USERS: string;
  GITHUB_OAUTH_SCOPE?: string;
};

type GitHubTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GitHubUser = {
  login?: string;
};

function htmlResponse(html: string, init?: ResponseInit): Response {
  return new Response(html, {
    ...init,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...init?.headers
    }
  });
}

function errorHtml(message: string): Response {
  return htmlResponse(buildCallbackHtml('error', { error: message }), { status: 403 });
}

async function exchangeCodeForToken(code: string, requestUrl: URL, env: Env): Promise<string> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'astro-blog-decap-oauth'
    },
    body: JSON.stringify({
      client_id: env.GITHUB_OAUTH_ID,
      client_secret: env.GITHUB_OAUTH_SECRET,
      code,
      redirect_uri: `${requestUrl.origin}/callback?provider=github`
    })
  });

  const data = (await response.json()) as GitHubTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'GitHub OAuth token exchange failed');
  }

  return data.access_token;
}

async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'astro-blog-decap-oauth'
    }
  });

  if (!response.ok) {
    throw new Error('Could not read GitHub user for OAuth token');
  }

  return (await response.json()) as GitHubUser;
}

function validateEnv(env: Env): Response | null {
  if (!env.GITHUB_OAUTH_ID || !env.GITHUB_OAUTH_SECRET) {
    return new Response('GitHub OAuth client is not configured', { status: 500 });
  }

  if (!env.ALLOWED_GITHUB_USERS) {
    return new Response('ALLOWED_GITHUB_USERS is not configured', { status: 500 });
  }

  return null;
}

async function handleAuth(requestUrl: URL, env: Env): Promise<Response> {
  const provider = requestUrl.searchParams.get('provider');
  if (provider && provider !== 'github') {
    return new Response('Invalid provider', { status: 400 });
  }

  const authorizeUrl = await buildAuthorizeUrl(requestUrl, {
    clientId: env.GITHUB_OAUTH_ID,
    scope: env.GITHUB_OAUTH_SCOPE,
    stateSecret: env.GITHUB_OAUTH_SECRET
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl.toString()
    }
  });
}

async function handleCallback(request: Request, requestUrl: URL, env: Env): Promise<Response> {
  const code = requestUrl.searchParams.get('code');
  if (!code) {
    return errorHtml('Missing GitHub OAuth code');
  }

  const actualState = requestUrl.searchParams.get('state');
  if (!actualState || !(await verifySignedState(actualState, env.GITHUB_OAUTH_SECRET))) {
    return errorHtml('Invalid GitHub OAuth state');
  }

  try {
    const token = await exchangeCodeForToken(code, requestUrl, env);
    const user = await fetchGitHubUser(token);

    if (!user.login || !isAllowedUser(user.login, env.ALLOWED_GITHUB_USERS)) {
      return errorHtml('This GitHub user is not allowed to publish this blog');
    }

    return htmlResponse(buildCallbackHtml('success', { token }));
  } catch (error) {
    return errorHtml(error instanceof Error ? error.message : 'GitHub OAuth failed');
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const envError = validateEnv(env);
    if (envError) {
      return envError;
    }

    const requestUrl = new URL(request.url);

    if (requestUrl.pathname === '/auth') {
      return handleAuth(requestUrl, env);
    }

    if (requestUrl.pathname === '/callback') {
      return handleCallback(request, requestUrl, env);
    }

    return new Response('Decap CMS GitHub OAuth proxy is running');
  }
};
