import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import { API_BASE_URL, TOKEN_KEYS } from '../src/services/apiClient';
import { videoCallApi, type VideoCallRecord } from '../src/services/videoCallApi';

const backendCall: VideoCallRecord = {
  id: 123,
  conversationId: 456,
  callerId: 111,
  receiverId: 222,
  status: 'CALLING',
  startedAt: null,
  endedAt: null,
  createdAt: 1234567890,
};

interface RecordedRequest {
  url: string;
  options: RequestInit;
}

function mockBackend(t: TestContext, body: unknown, status = 200): RecordedRequest[] {
  const originalFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const requests: RecordedRequest[] = [];
  const values = new Map([[TOKEN_KEYS.ACCESS_TOKEN, 'test-access-token']]);
  const storage: Storage = {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: async (input: string | URL | Request, options: RequestInit = {}) => {
      requests.push({ url: String(input), options });
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  });
  t.after(() => {
    if (originalFetch) Object.defineProperty(globalThis, 'fetch', originalFetch);
    else Reflect.deleteProperty(globalThis, 'fetch');
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });
  return requests;
}

test('creating a call posts its real conversation ID and preserves the backend record', async (t) => {
  const requests = mockBackend(t, { success: true, data: backendCall });
  const call = await videoCallApi.create(backendCall.conversationId);

  assert.deepEqual(call, backendCall);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, `${API_BASE_URL}/api/calls`);
  assert.equal(requests[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(String(requests[0].options.body)), { conversationId: 456 });
  const headers = new Headers(requests[0].options.headers);
  assert.equal(headers.get('Content-Type'), 'application/json');
  assert.equal(headers.get('Authorization'), 'Bearer test-access-token');
});

test('accept, reject, and end post the existing call ID to their backend endpoints', async (t) => {
  for (const [action, status] of [
    ['accept', 'ACCEPTED'],
    ['reject', 'REJECTED'],
    ['end', 'COMPLETED'],
  ] as const) {
    await t.test(action, async (subtest) => {
      const response: VideoCallRecord = {
        ...backendCall,
        status,
        startedAt: 1234567891,
        endedAt: status === 'COMPLETED' ? 1234567892 : null,
      };
      const requests = mockBackend(subtest, { success: true, data: response });

      assert.deepEqual(await videoCallApi[action](backendCall.id), response);
      assert.equal(requests.length, 1);
      assert.equal(requests[0].url, `${API_BASE_URL}/api/calls/123/${action}`);
      assert.equal(requests[0].options.method, 'POST');
      assert.equal(requests[0].options.body, undefined);
    });
  }
});

test('HTTP failures never return a successful call record', async (t) => {
  for (const [action, status] of [
    ['create', 500],
    ['accept', 409],
    ['reject', 404],
    ['end', 403],
  ] as const) {
    await t.test(`${action}: ${status}`, async (subtest) => {
      const requests = mockBackend(subtest, {
        success: false,
        message: 'Call operation denied',
        data: backendCall,
      }, status);
      await assert.rejects(videoCallApi[action](action === 'create' ? 456 : 123), (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, 'Call operation denied');
        assert.equal((error as Error & { status: number }).status, status);
        return true;
      });
      assert.equal(requests.length, 1);
    });
  }
});

test('HTTP 200 with success false cannot accept, reject, end, or create a call', async (t) => {
  for (const action of ['create', 'accept', 'reject', 'end'] as const) {
    await t.test(action, async (subtest) => {
      mockBackend(subtest, { success: false, data: backendCall });
      await assert.rejects(videoCallApi[action](action === 'create' ? 456 : 123));
    });
  }
});

test('malformed call identity or unknown status is rejected before consumers can use it', async (t) => {
  const malformed = [
    { ...backendCall, id: '123' },
    { ...backendCall, conversationId: 0 },
    { ...backendCall, callerId: -111 },
    { ...backendCall, callerId: undefined },
    { ...backendCall, receiverId: 222.5 },
    { ...backendCall, receiverId: '222' },
    { ...backendCall, status: 'CONNECTED' },
    undefined,
    null,
  ];
  for (const [index, data] of malformed.entries()) {
    await t.test(`malformed response ${index + 1}`, async (subtest) => {
      mockBackend(subtest, { success: true, data });
      await assert.rejects(videoCallApi.accept(backendCall.id));
    });
  }
});

test('an invalid conversation ID cannot send a create request', async (t) => {
  const requests = mockBackend(t, { success: true, data: backendCall });
  for (const conversationId of [0, -1, 456.5, NaN, Infinity]) {
    await assert.rejects(videoCallApi.create(conversationId));
  }
  assert.equal(requests.length, 0);
});
