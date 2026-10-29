import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCallStatusEvent,
  callEventMatchesCall,
  canEnterVideoCall,
  isTerminalCallStatus,
  parseCallEvent,
  type CallEvent,
} from '../src/services/callEvents';
import type { VideoCallRecord, VideoCallStatus } from '../src/services/videoCallApi';

const incoming: CallEvent = {
  eventId: 'incoming-123',
  type: 'INCOMING_CALL',
  callId: 123,
  conversationId: 456,
  callerId: 111,
  receiverId: 222,
  status: 'CALLING',
  timestamp: 1234567890,
};

const calling: VideoCallRecord = {
  id: incoming.callId,
  conversationId: incoming.conversationId,
  callerId: incoming.callerId,
  receiverId: incoming.receiverId,
  status: 'CALLING',
  startedAt: null,
  endedAt: null,
  createdAt: incoming.timestamp,
};

function statusEvent(status: VideoCallStatus, overrides: Partial<CallEvent> = {}): CallEvent {
  return {
    ...incoming,
    eventId: `status-123-${status}`,
    type: 'CALL_STATUS_CHANGED',
    status,
    timestamp: incoming.timestamp + 1,
    ...overrides,
  };
}

test('the documented incoming and accepted payloads retain the real call identifiers', () => {
  assert.deepEqual(parseCallEvent(JSON.stringify(incoming), 'INCOMING_CALL'), incoming);
  const accepted = statusEvent('ACCEPTED');
  assert.deepEqual(parseCallEvent(JSON.stringify(accepted), 'CALL_STATUS_CHANGED'), accepted);
});

test('malformed notifications cannot create a call or cross the incoming/status destinations', () => {
  const invalidBodies = ['{', 'null', '[]', 'true', '"INCOMING_CALL"'];
  for (const body of invalidBodies) {
    assert.equal(parseCallEvent(body, 'INCOMING_CALL'), null, body);
  }
  const invalidPayloads = [
    { ...incoming, eventId: '' },
    { ...incoming, callId: '123' },
    { ...incoming, conversationId: 0 },
    { ...incoming, callerId: -111 },
    { ...incoming, receiverId: 222.5 },
    { ...incoming, timestamp: null },
    { ...incoming, status: 'CONNECTED' },
    { ...incoming, status: 'ACCEPTED' },
    { ...incoming, type: 'CALL_STATUS_CHANGED' },
  ];
  for (const payload of invalidPayloads) {
    assert.equal(parseCallEvent(JSON.stringify(payload), 'INCOMING_CALL'), null);
  }
  assert.equal(parseCallEvent(JSON.stringify(incoming), 'CALL_STATUS_CHANGED'), null);
  assert.equal(parseCallEvent(JSON.stringify(statusEvent('ACCEPTED', { receiverId: undefined })), 'CALL_STATUS_CHANGED'), null);
});

test('a shared call ID is insufficient when a status belongs to a different conversation or participant', () => {
  const accepted = statusEvent('ACCEPTED');
  assert.equal(callEventMatchesCall(accepted, incoming), true);
  assert.equal(callEventMatchesCall(accepted, calling), true);
  for (const overrides of [
    { callId: 999 },
    { conversationId: 999 },
    { callerId: 999 },
    { receiverId: 999 },
  ]) {
    const unrelated = statusEvent('ACCEPTED', overrides);
    assert.equal(callEventMatchesCall(unrelated, incoming), false);
    assert.equal(callEventMatchesCall(unrelated, calling), false);
    assert.equal(applyCallStatusEvent(calling, unrelated).status, 'CALLING');
  }
  assert.equal(callEventMatchesCall(accepted, null), false);
  assert.equal(callEventMatchesCall(accepted, undefined), false);
});

test('the receiver waits for acceptance while the caller can display the dialing screen', () => {
  assert.equal(canEnterVideoCall(calling, calling.callerId), true);
  assert.equal(canEnterVideoCall(calling, calling.receiverId), false);
  const accepted = applyCallStatusEvent(calling, statusEvent('ACCEPTED'));
  assert.equal(canEnterVideoCall(accepted, calling.callerId), true);
  assert.equal(canEnterVideoCall(accepted, calling.receiverId), true);
  assert.equal(calling.status, 'CALLING');
});

test('successful acceptance survives a delayed CALLING notification during the REST request', () => {
  const acceptedResponse: VideoCallRecord = { ...calling, status: 'ACCEPTED', startedAt: incoming.timestamp + 5 };
  const delayedCalling = statusEvent('CALLING', { timestamp: incoming.timestamp + 10 });
  const resolved = applyCallStatusEvent(acceptedResponse, delayedCalling);
  assert.equal(resolved.status, 'ACCEPTED');
  assert.equal(resolved.startedAt, acceptedResponse.startedAt);
  assert.equal(canEnterVideoCall(resolved, calling.receiverId), true);
});

test('a matching completion during acceptance prevents entering an already ended call', () => {
  const acceptedResponse: VideoCallRecord = { ...calling, status: 'ACCEPTED' };
  const resolved = applyCallStatusEvent(acceptedResponse, statusEvent('COMPLETED'));
  assert.equal(resolved.status, 'COMPLETED');
  assert.equal(canEnterVideoCall(resolved, calling.receiverId), false);
  assert.equal(canEnterVideoCall(resolved, calling.callerId), false);
});

test('completion from another participant tuple cannot close this accepted call', () => {
  const acceptedResponse: VideoCallRecord = { ...calling, status: 'ACCEPTED' };
  const resolved = applyCallStatusEvent(acceptedResponse, statusEvent('COMPLETED', { receiverId: 333 }));
  assert.equal(resolved.status, 'ACCEPTED');
  assert.equal(canEnterVideoCall(resolved, calling.receiverId), true);
});

test('reconnect replay cannot revive a rejected, completed, missed, or busy call', () => {
  const terminalStatuses: VideoCallStatus[] = ['REJECTED', 'COMPLETED', 'MISSED', 'BUSY'];
  for (const terminalStatus of terminalStatuses) {
    const ended: VideoCallRecord = { ...calling, status: terminalStatus, endedAt: incoming.timestamp + 20 };
    assert.equal(isTerminalCallStatus(ended.status), true);
    for (const replayedStatus of ['CALLING', 'ACCEPTED'] as const) {
      const replayed = applyCallStatusEvent(ended, statusEvent(replayedStatus, { timestamp: incoming.timestamp + 30 }));
      assert.deepEqual(replayed, ended);
      assert.equal(canEnterVideoCall(replayed, calling.callerId), false);
      assert.equal(canEnterVideoCall(replayed, calling.receiverId), false);
    }
  }
});

test('rejecting a pending call never enables the receiver video screen', () => {
  const rejected = applyCallStatusEvent(calling, statusEvent('REJECTED'));
  assert.equal(rejected.status, 'REJECTED');
  assert.equal(canEnterVideoCall(rejected, calling.receiverId), false);
  assert.equal(isTerminalCallStatus(rejected.status), true);
});

test('a missing status event preserves the backend acceptance response', () => {
  const acceptedResponse: VideoCallRecord = { ...calling, status: 'ACCEPTED' };
  assert.deepEqual(applyCallStatusEvent(acceptedResponse, undefined), acceptedResponse);
  assert.equal(isTerminalCallStatus('CALLING'), false);
  assert.equal(isTerminalCallStatus('ACCEPTED'), false);
});

test('accepted call data cannot admit another user or an unauthenticated user', () => {
  const acceptedResponse: VideoCallRecord = { ...calling, status: 'ACCEPTED' };
  for (const userId of [undefined, 0, 333]) {
    assert.equal(canEnterVideoCall(calling, userId), false);
    assert.equal(canEnterVideoCall(acceptedResponse, userId), false);
  }
});
