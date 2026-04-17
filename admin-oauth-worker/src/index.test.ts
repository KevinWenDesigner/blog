import { afterEach, describe, expect, it, vi } from 'vitest';

import worker from './index';
import { createSignedState } from './auth';

const env = {
  GITHUB_OAUTH_ID: 'client-id',
  GITHUB_OAUTH_SECRET: 'github-secret',
  ALLOWED_GITHUB_USERS: 'KevinWenDesigner',
  GITHUB_OAUTH_SCOPE: 'public_repo,user'
};

describe('admin OAuth worker', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts a signed callback state without relying on cookies', async () => {
    const state = await createSignedState(env.GITHUB_OAUTH_SECRET);

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === 'https://github.com/login/oauth/access_token') {
          return Response.json({ access_token: 'gho_token' });
        }

        if (url === 'https://api.github.com/user') {
          return Response.json({ login: 'KevinWenDesigner' });
        }

        return new Response('not found', { status: 404 });
      })
    );

    const response = await worker.fetch(
      new Request(
        `https://auth.example.com/callback?provider=github&code=github-code&state=${encodeURIComponent(state)}`
      ),
      env
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toContain('authorization:github:success:');
  });
});
