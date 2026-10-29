/**
 * Real frontend/browser checks with a simulated REST + STOMP backend.
 * These checks do not establish live backend authorization or delivery.
 *
 * Start the frontend, then provide PUPPETEER_MODULE_PATH (a module exporting
 * puppeteer/default) and optionally BROWSER_EXECUTABLE_PATH, FRONTEND_TEST_URL,
 * BROWSER_ARTIFACT_DIR and BROWSER_TEST_FILTER. No browser/package download is performed.
 */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.PUPPETEER_MODULE_PATH;
if (!modulePath) throw new Error('Set PUPPETEER_MODULE_PATH to an installed Puppeteer module.');
const imported = await import(modulePath.startsWith('file:') ? modulePath : pathToFileURL(path.resolve(modulePath)).href);
const puppeteer = imported.puppeteer ?? imported.default;
const browserPath = process.env.BROWSER_EXECUTABLE_PATH
  ?? path.join(process.env.ProgramFiles ?? 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe');
const frontendUrl = process.env.FRONTEND_TEST_URL ?? 'http://localhost:3001';
const artifactDirectory = process.env.BROWSER_ARTIFACT_DIR;
const testFilter = process.env.BROWSER_TEST_FILTER;
const browser = await puppeteer.launch({
  executablePath: browserPath,
  headless: true,
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
});
let passed = 0;
let failed = 0;
let eventSequence = 0;

const call = { id: 123, conversationId: 456, callerId: 111, receiverId: 222,
  status: 'CALLING', startedAt: null, endedAt: null, createdAt: 1000 };
const event = (overrides = {}) => ({ eventId: `browser-event-${++eventSequence}`,
  type: 'INCOMING_CALL', callId: call.id, conversationId: call.conversationId,
  callerId: call.callerId, receiverId: call.receiverId, status: 'CALLING',
  timestamp: 1000 + eventSequence, ...overrides });
const statusEvent = (status, overrides = {}) => event({ type: 'CALL_STATUS_CHANGED', status, ...overrides });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Runs before app scripts, and intercepts only application backend traffic.
function installMockBackend(userId, callFixture) {
  localStorage.setItem('signbridge_auth', 'true');
  localStorage.setItem('signbridge_access_token', 'browser-test-token');
  localStorage.setItem('signbridge_refresh_token', 'browser-test-refresh-token');
  localStorage.setItem('signbridge_user', JSON.stringify({ userId, username: `User ${userId}`, role: 'USER', emailVerified: true }));
  const state = { requests: [], sockets: [], subscriptions: new Map(), mediaRequests: 0,
    peerConnections: [], response: {}, deferred: null, sequence: 0, loginUserId: 333,
    connectTokens: [], maxLiveSockets: 0 };
  const nativeFetch = window.fetch.bind(window);
  const NativeWebSocket = window.WebSocket;
  const NativePeerConnection = window.RTCPeerConnection;
  const nativeGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = (...args) => {
    state.mediaRequests += 1;
    return nativeGetUserMedia(...args);
  };
  window.RTCPeerConnection = class extends NativePeerConnection {
    constructor(options) {
      // Local browser tests need host candidates only, with no external STUN traffic.
      super({ ...options, iceServers: [] });
      state.peerConnections.push(this);
    }
  };
  const respond = (data, status = 200) => new Response(JSON.stringify({ success: status < 400,
    status, message: status < 400 ? 'OK' : 'Simulated backend failure', data }),
  { status, headers: { 'Content-Type': 'application/json' } });
  window.fetch = async (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.origin);
    if (!url.pathname.startsWith('/api/')) return nativeFetch(input, options);
    const method = options.method ?? 'GET';
    state.requests.push({ path: url.pathname, method, body: options.body });
    if (url.pathname === '/api/auth/login') return respond({
      user: { userId: state.loginUserId, username: `User ${state.loginUserId}`, role: 'USER', emailVerified: true },
      tokens: { accessToken: `browser-test-token-${state.loginUserId}`, refreshToken: 'browser-test-refresh-token',
        tokenType: 'Bearer', accessExpiresAt: Date.now() + 60000, refreshExpiresAt: Date.now() + 600000 },
    });
    if (url.pathname === '/api/calls' && method === 'POST') {
      await window.__mockBackendSend?.('create', callFixture);
      return respond(callFixture);
    }
    const action = url.pathname.match(/^\/api\/calls\/(\d+)\/(accept|reject|end)$/);
    if (action) {
      const config = { ...state.response };
      if (config.defer) await new Promise((resolve) => { state.deferred = resolve; });
      const status = config.status ?? 200;
      const result = { ...callFixture, id: Number(action[1]),
        status: config.callStatus ?? ({ accept: 'ACCEPTED', reject: 'REJECTED', end: 'COMPLETED' })[action[2]],
        ...config.tuple };
      if (status < 400) await window.__mockBackendSend?.('status', result);
      return respond(result, status);
    }
    if (url.pathname === '/api/conversations') return respond([{
      conversationId: callFixture.conversationId, type: 'PRIVATE', name: null,
      participants: [{ userId: 111, fullName: 'Caller 111', avatar: null, joinedAt: 1000 },
        { userId: 222, fullName: 'Receiver 222', avatar: null, joinedAt: 1000 }],
      lastMessage: null, updatedAt: 1000,
    }]);
    if (url.pathname.endsWith('/messages')) return respond({ messages: [], nextCursor: null, hasMore: false });
    if (url.pathname.endsWith('/unread-count')) return respond({ conversationId: 456, unreadCount: 0 });
    if (url.pathname.endsWith('/presence')) return respond({ conversationId: 456, userId: userId === 111 ? 222 : 111, status: 'ONLINE', lastSeenAt: null });
    if (url.pathname === '/api/users/me') return respond(JSON.parse(localStorage.getItem('signbridge_user')));
    return respond([]);
  };
  class BackendSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;
    constructor(url, protocols) {
      if (!new URL(url).pathname.startsWith('/ws/chat')) return new NativeWebSocket(url, protocols);
      this.url = url;
      this.readyState = 0;
      this.binaryType = 'arraybuffer';
      this.listeners = new Map();
      state.sockets.push(this);
      setTimeout(() => {
        this.readyState = 1;
        state.maxLiveSockets = Math.max(state.maxLiveSockets, state.sockets.filter((socket) => socket.readyState === 1).length);
        this.dispatch('open', {});
      }, 0);
    }
    addEventListener(type, listener) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(listener);
    }
    removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
    dispatch(type, payload) {
      this[`on${type}`]?.(payload);
      for (const listener of this.listeners.get(type) ?? []) listener(payload);
    }
    send(data) {
      const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
      const [head, body = ''] = text.split('\n\n');
      const [command, ...lines] = head.split('\n');
      const headers = Object.fromEntries(lines.map((line) => {
        const index = line.indexOf(':');
        return [line.slice(0, index), line.slice(index + 1)];
      }));
      if (command === 'CONNECT' || command === 'STOMP') {
        state.connectTokens.push(headers.Authorization);
        setTimeout(() => this.dispatch('message', { data: 'CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0' }), 0);
      } else if (command === 'SUBSCRIBE') {
        state.subscriptions.set(headers.id, { socket: this, destination: headers.destination });
      } else if (command === 'UNSUBSCRIBE') {
        state.subscriptions.delete(headers.id);
      } else if (command === 'SEND' && headers.destination.endsWith('/webrtc')) {
        void window.__mockBackendSend?.('signal', { destination: headers.destination, body: JSON.parse(body.replace(/\0$/, '')) });
      } else if (command === 'DISCONNECT') this.close();
    }
    close() {
      this.readyState = 3;
      for (const [id, entry] of state.subscriptions) if (entry.socket === this) state.subscriptions.delete(id);
      this.dispatch('close', {});
    }
  }
  window.WebSocket = BackendSocket;
  window.__callTest = {
    state,
    emit(destination, payload) {
      let delivered = 0;
      for (const [id, entry] of state.subscriptions) {
        if (entry.destination !== destination || entry.socket.readyState !== 1) continue;
        entry.socket.dispatch('message', { data: `MESSAGE\nsubscription:${id}\nmessage-id:test-${++state.sequence}\ndestination:${destination}\n\n${JSON.stringify(payload)}\0` });
        delivered += 1;
      }
      return delivered;
    },
    configure(response) { state.response = response; },
    resolve() { const release = state.deferred; state.deferred = null; release?.(); },
    snapshot() {
      return { requests: state.requests, mediaRequests: state.mediaRequests,
        peerStates: state.peerConnections.map((pc) => pc.connectionState),
        destinations: [...state.subscriptions.values()].map((entry) => entry.destination),
        liveSockets: state.sockets.filter((socket) => socket.readyState === 1).length,
        maxLiveSockets: state.maxLiveSockets, connectTokens: state.connectTokens };
    },
  };
}

async function newPage(userId = 222, route = '/dashboard', onBackendMessage) {
  // Caller and receiver must have isolated localStorage/session identities.
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.exposeFunction('__mockBackendSend', async (kind, payload) => onBackendMessage?.(page, userId, kind, payload));
  await page.evaluateOnNewDocument(installMockBackend, userId, call);
  await page.goto(`${frontendUrl}${route}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__callTest.snapshot().destinations.includes('/user/queue/calls/incoming'));
  return page;
}
const emit = (page, value, destination = value.type === 'INCOMING_CALL' ? '/user/queue/calls/incoming' : '/user/queue/calls/status') =>
  page.evaluate((destinationValue, eventValue) => window.__callTest.emit(destinationValue, eventValue), destination, value);
const configure = (page, response) => page.evaluate((value) => window.__callTest.configure(value), response);
const snapshot = (page) => page.evaluate(() => window.__callTest.snapshot());
const resolve = (page) => page.evaluate(() => window.__callTest.resolve());
const popup = '#incoming-call-notifications [role="alertdialog"]';
const accept = `${popup} button:first-of-type`;
const reject = `${popup} button:last-of-type`;
async function pending(page, incoming = event()) {
  assert.equal(await emit(page, incoming), 1, 'incoming destination subscribed exactly once');
  await page.waitForSelector(popup, { visible: true });
}
async function noVideo(page) {
  assert.equal(await page.$('#call-video-grid'), null, 'active video screen is absent');
  assert.equal((await snapshot(page)).mediaRequests, 0, 'camera is not acquired before acceptance');
}
async function test(name, run) {
  if (testFilter && !name.includes(testFilter)) return;
  try { await run(); passed += 1; console.log(`PASS ${name}`); }
  catch (error) { failed += 1; console.error(`FAIL ${name}: ${error.stack ?? error}`); }
}
async function withPage(run, userId, route) {
  const page = await newPage(userId, route);
  try { await run(page); } finally { await page.browserContext().close(); }
}

try {
  await test('incoming panel is visible at bottom-right on desktop/mobile; CALLING does not acquire media', () => withPage(async (page) => {
    await pending(page);
    await noVideo(page);
    const initial = await snapshot(page);
    assert.equal(initial.liveSockets, 1, 'one shared backend socket');
    for (const destination of ['/user/queue/calls/incoming', '/user/queue/calls/status']) {
      assert.equal(initial.destinations.filter((value) => value === destination).length, 1);
    }
    if (artifactDirectory) await mkdir(artifactDirectory, { recursive: true });
    for (const [label, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
      await page.setViewport({ width, height });
      await sleep(100);
      const bounds = await page.$eval('#incoming-call-notifications', (node) => {
        const rect = node.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      });
      assert.ok(bounds.left >= 0 && bounds.top >= 0);
      assert.ok(Math.abs(width - bounds.right - 16) <= 1, 'right edge has 16px inset');
      assert.ok(Math.abs(height - bounds.bottom - 16) <= 1, 'bottom edge has 16px inset');
      if (artifactDirectory) await page.screenshot({ path: path.join(artifactDirectory, `incoming-call-${label}.png`) });
    }
  }));

  await test('receiver filtering, callId deduplication and one pending call', () => withPage(async (page) => {
    await emit(page, event({ receiverId: 333 }));
    await sleep(50);
    assert.equal(await page.$(popup), null);
    await pending(page);
    await emit(page, event());
    await emit(page, event({ callId: 124, callerId: 333 }));
    await sleep(50);
    assert.equal((await page.$$(popup)).length, 1);
    assert.match(await page.$eval(popup, (node) => node.textContent), /Cuộc gọi #123/);
    await noVideo(page);
  }));

  await test('Accept defers navigation, disables both controls, prevents double POST, then acquires media once', () => withPage(async (page) => {
    await pending(page);
    await configure(page, { defer: true });
    await page.$eval(accept, (button) => { button.click(); button.click(); });
    await page.waitForFunction(() => window.__callTest.state.deferred !== null);
    assert.deepEqual((await page.$$eval(`${popup} button`, (buttons) => buttons.map((button) => button.disabled))), [true, true]);
    assert.match(await page.$eval(accept, (button) => button.textContent), /Đang chấp nhận/);
    assert.equal((await snapshot(page)).requests.filter((request) => request.path === '/api/calls/123/accept').length, 1);
    await noVideo(page);
    await emit(page, statusEvent('CALLING'));
    await resolve(page);
    await page.waitForSelector('#call-video-grid');
    await page.waitForFunction(() => window.__callTest.snapshot().mediaRequests > 0);
    assert.equal((await snapshot(page)).mediaRequests, 1);
    assert.equal(new URL(page.url()).pathname, '/call');
    assert.equal(await page.$(popup), null);
    assert.match(await page.$eval('body', (node) => node.textContent), /Người gọi #111/);
    await emit(page, statusEvent('CALLING'));
    await sleep(50);
    assert.match(await page.$eval('body', (node) => node.textContent), /Đã kết nối/);
    await emit(page, statusEvent('COMPLETED'));
    await page.waitForFunction(() => location.pathname === '/dashboard');
    assert.equal(await page.$('#call-video-grid'), null);
  }));

  await test('Reject waits for backend and never enters video', () => withPage(async (page) => {
    await pending(page);
    await configure(page, { defer: true });
    await page.$eval(reject, (button) => { button.click(); button.click(); });
    await page.waitForFunction(() => window.__callTest.state.deferred !== null);
    assert.deepEqual(await page.$$eval(`${popup} button`, (buttons) => buttons.map((button) => button.disabled)), [true, true]);
    assert.match(await page.$eval(reject, (button) => button.textContent), /Đang từ chối/);
    assert.equal((await snapshot(page)).requests.filter((request) => request.path === '/api/calls/123/reject').length, 1);
    await noVideo(page);
    await resolve(page);
    await page.waitForFunction(() => !document.querySelector('#incoming-call-notifications'));
    await noVideo(page);
  }));

  for (const action of ['accept', 'reject']) for (const status of [403, 409, 500]) {
    await test(`${action} HTTP ${status} preserves panel/error and allows retry`, () => withPage(async (page) => {
      await pending(page);
      await configure(page, { status });
      await page.click(action === 'accept' ? accept : reject);
      await page.waitForSelector(`${popup} [role="alert"]`);
      assert.equal(await page.$eval(accept, (button) => button.disabled), false);
      await noVideo(page);
      await configure(page, {});
      await page.click(action === 'accept' ? accept : reject);
      if (action === 'accept') await page.waitForSelector('#call-video-grid');
      else await page.waitForFunction(() => !document.querySelector('#incoming-call-notifications'));
      assert.equal((await snapshot(page)).requests.filter((request) => request.path === `/api/calls/123/${action}`).length, 2);
    }));
  }

  await test('invalid accept status/tuple does not open video and can be retried', () => withPage(async (page) => {
    await pending(page);
    for (const response of [{ callStatus: 'CALLING' }, { tuple: { receiverId: 333 } }]) {
      await configure(page, response);
      await page.click(accept);
      await page.waitForSelector(`${popup} [role="alert"]`);
      await noVideo(page);
    }
  }));

  await test('status events match entire call tuple and terminal events clear/suppress pending', () => withPage(async (page) => {
    await pending(page);
    await emit(page, statusEvent('COMPLETED', { conversationId: 999 }));
    await sleep(50);
    assert.ok(await page.$(popup));
    await emit(page, statusEvent('COMPLETED'));
    await page.waitForFunction(() => !document.querySelector('#incoming-call-notifications'));
    await emit(page, event());
    await emit(page, statusEvent('REJECTED', { callId: 124 }));
    await emit(page, event({ callId: 124 }));
    await sleep(50);
    assert.equal(await page.$(popup), null);
    await noVideo(page);
  }));

  await test('COMPLETED received during Accept prevents stale successful response from entering video', () => withPage(async (page) => {
    await pending(page);
    await configure(page, { defer: true });
    await page.click(accept);
    await page.waitForFunction(() => window.__callTest.state.deferred !== null);
    await emit(page, statusEvent('COMPLETED'));
    await resolve(page);
    await sleep(100);
    assert.equal(await page.$(popup), null);
    await noVideo(page);
  }));

  await test('logout clears pending call and ignores stale Accept completion', () => withPage(async (page) => {
    await pending(page);
    await configure(page, { defer: true });
    await page.click(accept);
    await page.waitForFunction(() => window.__callTest.state.deferred !== null);
    await page.evaluate(() => [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Đăng xuất').click());
    await page.waitForFunction(() => location.pathname === '/login');
    await resolve(page);
    await sleep(100);
    assert.equal(await page.$(popup), null);
    await noVideo(page);
    assert.equal(new URL(page.url()).pathname, '/login');
  }, 222, '/profile'));

  await test('session transition: terminal event while Accept is pending does not admit another call', () => withPage(async (page) => {
    await pending(page);
    await configure(page, { defer: true });
    await page.click(accept);
    await page.waitForFunction(() => window.__callTest.state.deferred !== null);
    await emit(page, statusEvent('COMPLETED'));
    await emit(page, event({ callId: 124, callerId: 333 }));
    await sleep(50);
    assert.equal(await page.$(popup), null, 'pending request still owns the incoming call slot');
    await resolve(page);
    await sleep(100);
    await noVideo(page);
    await pending(page, event({ callId: 125, callerId: 333 }));
    assert.equal(await page.$(`${popup} [role="alert"]`), null, 'next call has no previous request error');
  }));

  await test('session transition: re-authentication closes old socket and binds exactly one new principal', () => withPage(async (page) => {
    await pending(page);
    await page.evaluate(() => {
      history.pushState({}, '', '/login');
      dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForSelector('input[type="password"]');
    await page.type('input[type="text"]', 'new-user');
    await page.type('input[type="password"]', 'BrowserTest123!');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => location.pathname === '/dashboard'
      && window.__callTest.snapshot().connectTokens.includes('Bearer browser-test-token-333'));
    await page.waitForFunction(() => window.__callTest.snapshot().destinations.includes('/user/queue/calls/incoming'));
    const result = await snapshot(page);
    assert.equal(result.liveSockets, 1);
    assert.equal(result.maxLiveSockets, 1, 'old and new principal sockets never overlap');
    assert.deepEqual(result.connectTokens, ['Bearer browser-test-token', 'Bearer browser-test-token-333']);
    for (const destination of ['/user/queue/calls/incoming', '/user/queue/calls/status']) {
      assert.equal(result.destinations.filter((value) => value === destination).length, 1);
    }
    assert.equal(await page.$(popup), null, 'old account pending popup cleared');
    await emit(page, event());
    await sleep(50);
    assert.equal(await page.$(popup), null, 'old receiver event ignored');
    await pending(page, event({ callId: 124, receiverId: 333 }));
  }));

  for (const action of ['accept', 'reject']) {
    await test(`two browser pages forward real UI ${action} status through mocked backend${action === 'accept' ? ' and connect existing WebRTC' : ''}`, async () => {
      const pages = new Map();
      const forward = async (source, userId, kind, payload) => {
        if (kind === 'create') return emit(pages.get(222), event());
        if (kind === 'status') {
          const changed = statusEvent(payload.status);
          await Promise.all([...pages.values()].filter((page) => !page.isClosed()).map((page) => emit(page, changed)));
        } else if (kind === 'signal') {
          const peerId = userId === 111 ? 222 : 111;
          const peer = pages.get(peerId);
          if (!peer || peer.isClosed()) return;
          await emit(peer, { eventId: `signal-${++eventSequence}`, callId: 123, senderId: userId,
            receiverId: peerId, timestamp: Date.now(), ...payload.body }, '/user/queue/calls/123/webrtc');
        }
      };
      try {
        const receiver = await newPage(222, '/dashboard', forward);
        pages.set(222, receiver);
        const caller = await newPage(111, '/dashboard', forward);
        pages.set(111, caller);
        await caller.waitForSelector('[title="Gọi video"]');
        await caller.click('[title="Gọi video"]');
        await receiver.waitForSelector(popup);
        await caller.waitForSelector('#call-video-grid');
        assert.equal((await snapshot(caller)).mediaRequests, 0);
        await noVideo(receiver);
        await receiver.click(action === 'accept' ? accept : reject);
        if (action === 'accept') {
          await receiver.waitForSelector('#call-video-grid');
          await Promise.all([caller, receiver].map((page) => page.waitForFunction(() =>
            window.__callTest.snapshot().peerStates.includes('connected'), { timeout: 20000 })));
          for (const page of [caller, receiver]) {
            assert.equal((await snapshot(page)).mediaRequests, 1);
            assert.match(await page.$eval('body', (node) => node.textContent), /Đã kết nối/);
          }
          await Promise.all([caller, receiver].map((page) => emit(page, statusEvent('COMPLETED'))));
          await Promise.all([caller, receiver].map((page) => page.waitForFunction(() => location.pathname === '/dashboard')));
        } else {
          await caller.waitForFunction(() => location.pathname === '/dashboard');
          await receiver.waitForFunction(() => !document.querySelector('#incoming-call-notifications'));
          await noVideo(receiver);
        }
      } finally { await Promise.all([...pages.values()].map((page) => page.browserContext().close())); }
    });
  }
} finally {
  await browser.close();
}
console.log(`Mock-backend browser integration: ${passed} passed, ${failed} failed. Live backend/two-account test: NOT VERIFIED.`);
if (failed) process.exitCode = 1;
