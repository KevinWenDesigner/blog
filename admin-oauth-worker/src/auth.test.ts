import { describe, expect, it } from 'vitest';

import {
  buildAuthorizeUrl,
  buildCallbackHtml,
  buildStateCookie,
  isAllowedUser,
  parseAllowedUsers,
  readCookieValue
} from './auth';

describe('admin OAuth helpers', () => {
  it('parses allowed GitHub users case-insensitively', () => {
    expect([...parseAllowedUsers('Kevin, alice ,BOB')]).toEqual(['kevin', 'alice', 'bob']);
  });

  it('rejects GitHub users outside the whitelist', () => {
    expect(isAllowedUser('Kevin', 'kevin,alice')).toBe(true);
    expect(isAllowedUser('mallory', 'kevin,alice')).toBe(false);
  });

  it('builds a GitHub authorize URL for the worker callback path', () => {
    const url = buildAuthorizeUrl(new URL('https://auth.example.com/auth?provider=github'), {
      clientId: 'client-id',
      scope: 'public_repo,user'
    });

    expect(url.origin).toBe('https://github.com');
    expect(url.pathname).toBe('/login/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('client-id');
    expect(url.searchParams.get('redirect_uri')).toBe('https://auth.example.com/callback?provider=github');
    expect(url.searchParams.get('scope')).toBe('public_repo,user');
    expect(url.searchParams.get('state')).toHaveLength(16);
  });

  it('posts the Decap CMS authorization message back to the opener', () => {
    const html = buildCallbackHtml('success', { token: 'gho_token' });

    expect(html).toContain('authorization:github:success:');
    expect(html).toContain('\\"token\\":\\"gho_token\\"');
    expect(html).toContain('window.opener.postMessage');
  });

  it('builds and reads the OAuth state cookie used to verify callbacks', () => {
    const cookie = buildStateCookie('state-123');

    expect(cookie).toContain('decap_oauth_state=state-123');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(readCookieValue('theme=light; decap_oauth_state=state-123; other=1', 'decap_oauth_state')).toBe(
      'state-123'
    );
  });
});
