## AI frame source for MVP calls

For the current call flow, the caller is the hearing viewer and the receiver is the signer. `App.tsx` assigns `SIGNER` only when the authenticated user's ID matches `receiverId`; all other clients receive `VIEWER`. Only `SIGNER` captures its existing local WebRTC camera for AI. Both participants may still receive `AI_SIGN_PREDICTION` events and see the subtitle.

This role is enforced in the frontend only. The backend prediction endpoint still accepts images from either authenticated participant in an active call; a direct API client can submit viewer frames. A trusted signer identity and server-side enforcement are required before treating this as a security boundary.

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/478f7eea-43c6-4680-98f3-d193c61ac8e9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## One-to-one WebRTC calls

Accepted calls use the authenticated STOMP connection for signaling at
`/app/calls/{callId}/webrtc` and `/user/queue/calls/{callId}/webrtc`.
The receiver sends `WEBRTC_READY` until the caller's offer arrives. Offer,
answer, and ICE messages are transient; media flows directly between browsers.
The existing backend call status and participant checks authorize every signal.

Configure ICE at Vite build time with `VITE_WEBRTC_ICE_SERVERS`, a JSON array
of `RTCIceServer` entries. If omitted or invalid, the frontend falls back to
Google's public STUN server. STUN discovers public-facing addresses but does
not relay media, so mobile carrier NATs and restrictive firewalls often need
TURN.

Example deployment value (replace hosts and temporary credentials):

```json
[{"urls":"stun:stun.l.google.com:19302"},{"urls":["turn:turn.example.com:3478?transport=udp","turns:turn.example.com:5349?transport=tcp"],"username":"<short-lived-username>","credential":"<short-lived-credential>"}]
```

Vite embeds every `VITE_*` value into public browser code. Never place a TURN
shared secret or permanent credential in `VITE_WEBRTC_ICE_SERVERS`. Configure
coturn or a managed TURN provider to issue time-limited credentials (for
example, through a backend endpoint authenticated by the user's session), then
inject that credential into the browser configuration at runtime or build
configuration. The TURN service must allow UDP relay traffic and TLS/TCP
fallback, and its relay port range must be open on the server firewall. Set
`iceTransportPolicy: "relay"` only for controlled diagnostics; using it in
production unnecessarily increases bandwidth and cost.

Signaling uses STOMP at `/app/calls/{callId}/webrtc` and
`/user/queue/calls/{callId}/webrtc`. The receiver announces readiness; caller
sends SDP offer, receiver responds with SDP answer, then each side trickles ICE
candidates. Candidates are buffered until remote SDP exists and sent only
after local SDP has been accepted for publishing. STOMP connectivity alone is
not shown as media success; the UI reports connected only after the peer
connection reaches its connected state. ICE disconnects get a short recovery
window, and a connected peer with no remote video is reported separately.

The implementation requires a real TURN service and two devices/networks for
deployment verification. Local type checking/build cannot establish that TURN
credentials, relay ports, mobile camera selection, or carrier NAT traversal
work in production.
