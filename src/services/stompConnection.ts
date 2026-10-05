import { Client, type StompSubscription } from '@stomp/stompjs';
import { API_BASE_URL, getStoredAccessToken } from './apiClient';

export type StompConnectionState = 'connecting' | 'online' | 'offline';
type MessageListener = (body: string) => void;
type StateListener = (state: StompConnectionState) => void;

interface DestinationEntry {
  listeners: Set<MessageListener>;
  subscription: StompSubscription | null;
}

const destinations = new Map<string, DestinationEntry>();
const stateListeners = new Set<StateListener>();
let client: Client | null = null;
let connectionState: StompConnectionState = 'offline';
let disconnectScheduled = false;

function setConnectionState(state: StompConnectionState): void {
  connectionState = state;
  for (const listener of stateListeners) listener(state);
}

function websocketUrl(): string {
  const url = new URL('/ws/chat', API_BASE_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

function subscribeEntry(activeClient: Client, destination: string, entry: DestinationEntry): void {
  if (entry.subscription || entry.listeners.size === 0 || !activeClient.connected) return;
  entry.subscription = activeClient.subscribe(destination, (message) => {
    for (const listener of entry.listeners) {
      try { listener(message.body); } catch { /* Keep other subscribers alive. */ }
    }
  });
}

function ensureConnected(): void {
  if (client) return;
  const token = getStoredAccessToken();
  if (!token) { setConnectionState('offline'); return; }
  let brokerURL: string;
  try { brokerURL = websocketUrl(); }
  catch { setConnectionState('offline'); return; }

  const activeClient = new Client({
    brokerURL,
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    beforeConnect: () => {
      if (client !== activeClient) return;
      const latestToken = getStoredAccessToken();
      if (!latestToken) {
        activeClient.connectHeaders = {};
        setConnectionState('offline');
        void activeClient.deactivate().catch(() => {});
      } else {
        activeClient.connectHeaders = { Authorization: `Bearer ${latestToken}` };
      }
    },
    onConnect: () => {
      if (client !== activeClient) return;
      let subscriptionsReady = true;
      for (const [destination, entry] of destinations) {
        try { subscribeEntry(activeClient, destination, entry); }
        catch { subscriptionsReady = false; }
      }
      setConnectionState(subscriptionsReady ? 'online' : 'offline');
    },
    onWebSocketClose: () => {
      if (client !== activeClient) return;
      for (const entry of destinations.values()) entry.subscription = null;
      setConnectionState('offline');
    },
    onWebSocketError: () => { if (client === activeClient) setConnectionState('offline'); },
    onStompError: () => { if (client === activeClient) setConnectionState('offline'); },
  });
  client = activeClient;
  setConnectionState('connecting');
  try { activeClient.activate(); }
  catch { client = null; setConnectionState('offline'); }
}

export function subscribeToStomp(
  destination: string,
  onMessage: MessageListener,
  onStateChange?: StateListener,
): () => void {
  let entry = destinations.get(destination);
  if (!entry) {
    entry = { listeners: new Set(), subscription: null };
    destinations.set(destination, entry);
  }
  entry.listeners.add(onMessage);
  if (onStateChange) {
    stateListeners.add(onStateChange);
    onStateChange(connectionState);
  }
  ensureConnected();
  if (client?.connected) {
    try { subscribeEntry(client, destination, entry); }
    catch { setConnectionState('offline'); }
  }

  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    entry.listeners.delete(onMessage);
    if (onStateChange) stateListeners.delete(onStateChange);
    if (entry.listeners.size === 0) {
      try { entry.subscription?.unsubscribe(); } catch { /* Socket may be closed. */ }
      destinations.delete(destination);
    }
    if (destinations.size === 0 && client && !disconnectScheduled) {
      disconnectScheduled = true;
      queueMicrotask(() => {
        disconnectScheduled = false;
        if (destinations.size !== 0 || !client) return;
        const oldClient = client;
        client = null;
        void oldClient.deactivate().catch(() => {});
        setConnectionState('offline');
      });
    }
  };
}

/** Signaling is transient; callers retry when the shared STOMP connection is offline. */
export function publishToStomp(destination: string, body: unknown): boolean {
  if (!client?.connected || connectionState !== 'online') return false;
  try {
    client.publish({ destination, body: JSON.stringify(body) });
    return true;
  } catch {
    return false;
  }
}
