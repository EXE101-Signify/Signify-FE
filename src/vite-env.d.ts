/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  /** JSON array of browser-safe RTCIceServer entries. TURN credentials must be short-lived. */
  readonly VITE_WEBRTC_ICE_SERVERS?: string;
}
