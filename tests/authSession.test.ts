import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import {
  apiFetch,
  refreshTokens,
  TOKEN_KEYS,
} from '../src/services/apiClient';

function mockAuthEnvironment(t: TestContext, fetcher: typeof fetch) {
  const originalFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>([
    [TOKEN_KEYS.ACCESS_TOKEN, 'expired-access-token'],
    [TOKEN_KEYS.REFRESH_TOKEN, 'valid-refresh-token'],
    [TOKEN_KEYS.USER, JSON.stringify({ userId: 42, username: 'member' })],
    [TOKEN_KEYS.AUTH, 'true'],
  ]);
  const storage: Storage = {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: fetcher });
  t.after(() => {
    if (originalFetch) Object.defineProperty(globalThis, 'fetch', originalFetch);
    else Reflect.deleteProperty(globalThis, 'fetch');
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });
  return values;
}

test('a valid refresh token refreshes an expired access token before retrying /me', async (t) => {
  const requests: Array<{ url: string; authorization: string | null }> = [];
  const values = mockAuthEnvironment(t, async (input, init) => {
    const url = String(input);
    requests.push({ url, authorization: new Headers(init?.headers).get('Authorization') });
    if (url.endsWith('/api/auth/refresh')) {
      return new Response(JSON.stringify({ success: true, data: {
        accessToken: 'new-access-token', refreshToken: 'new-refresh-token',
      } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (requests.filter((request) => request.url.endsWith('/api/users/me')).length === 1) {
      return new Response(JSON.stringify({ success: false }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ success: true, data: { userId: 42, username: 'member' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  const response = await apiFetch<{ userId: number }>('/api/users/me');

  assert.equal(response.data?.userId, 42);
  assert.equal(requests.length, 3);
  assert.equal(requests[2].authorization, 'Bearer new-access-token');
  assert.equal(values.get(TOKEN_KEYS.ACCESS_TOKEN), 'new-access-token');
  assert.equal(values.get(TOKEN_KEYS.REFRESH_TOKEN), 'new-refresh-token');
});

test('an invalid refresh token clears the stored session after /me is rejected', async (t) => {
  const values = mockAuthEnvironment(t, async (input) => new Response(
    JSON.stringify({ success: false, message: 'Unauthorized' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } },
  ));

  await assert.rejects(apiFetch('/api/users/me'), (error: unknown) => {
    assert.equal((error as { status?: number }).status, 401);
    return true;
  });

  assert.equal(values.has(TOKEN_KEYS.ACCESS_TOKEN), false);
  assert.equal(values.has(TOKEN_KEYS.REFRESH_TOKEN), false);
  assert.equal(values.has(TOKEN_KEYS.USER), false);
  assert.equal(values.has(TOKEN_KEYS.AUTH), false);
});

test('concurrent refresh requests share one backend refresh call', async (t) => {
  let requestCount = 0;
  mockAuthEnvironment(t, async () => {
    requestCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return new Response(JSON.stringify({ success: true, data: {
      accessToken: 'new-access-token', refreshToken: 'new-refresh-token',
    } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });

  const results = await Promise.all([refreshTokens(), refreshTokens()]);

  assert.deepEqual(results, [true, true]);
  assert.equal(requestCount, 1);
});
