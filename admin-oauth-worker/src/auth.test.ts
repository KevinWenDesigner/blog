import { describe, expect, it } from 'vitest';

import {
  buildAuthorizeUrl,
  buildCallbackHtml,
  createSignedState,
  verifySignedState,
  isAllowedUser,
  parseAllowedUsers
} from './auth';

describe('admin OAuth helpers', () => {
  it('parses allowed GitHub users case-insensitively', () => {
    expect([...parseAllowedUsers('Kevin, alice ,BOB')]).toEqual(['kevin', 'alice', 'bob']);
  });

  it('rejects GitHub users outside the whitelist', () => {
    expect(isAllowedUser('Kevin', 'kevin,alice')).toBe(true);
    expect(isAllowedUser('mallory', 'kevin,alice')).toBe(false);
  });

  it('builds a GitHub authorize URL with a self-verifying OAuth state', async () => {
    const url = await buildAuthorizeUrl(new URL('https://auth.example.com/auth?provider=github'), {
      clientId: 'client-id',
      scope: 'public_repo,user',
      stateSecret: 'github-secret'
    });

    expect(url.origin).toBe('https://github.com');
    expect(url.pathname).toBe('/login/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('client-id');
    expect(url.searchParams.get('redirect_uri')).toBe('https://auth.example.com/callback?provider=github');
    expect(url.searchParams.get('scope')).toBe('public_repo,user');

    const state = url.searchParams.get('state');
    expect(state).toBeTruthy();
    await expect(verifySignedState(state ?? '', 'github-secret')).resolves.toBe(true);
    await expect(verifySignedState(state ?? '', 'wrong-secret')).resolves.toBe(false);
  });

  it('uses Decap CMS OAuth popup handshake before posting the final authorization result', () => {
    const html = buildCallbackHtml('success', { token: 'gho_token' });

    expect(html).toContain('authorization:github:success:');
    expect(html).toContain('authorizing:github');
    expect(html).toContain('\\"token\\":\\"gho_token\\"');
    expect(html).toContain('window.addEventListener("message", receiveMessage, false)');
    expect(html.indexOf('window.addEventListener("message", receiveMessage, false)')).toBeLessThan(
      html.indexOf('authorizing:github')
    );
    expect(html).not.toContain('window.close()');
  });

  it('shows the OAuth result instead of throwing when callback is opened without an opener', () => {
    const html = buildCallbackHtml('error', { error: 'Invalid GitHub OAuth state' });

    expect(html).toContain('window.opener && typeof window.opener.postMessage === "function"');
    expect(html).toContain('Authorization failed: Invalid GitHub OAuth state');
  });

  it('rejects expired signed OAuth states', async () => {
    const state = await createSignedState('github-secret', 1_000);

    await expect(verifySignedState(state, 'github-secret', 1_000 + 10 * 60 * 1000 + 1)).resolves.toBe(false);
  });
});
