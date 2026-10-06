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

Set `VITE_WEBRTC_ICE_SERVERS` to a JSON array of `RTCIceServer` entries when
deploying, for example `[{"urls":"stun:stun.l.google.com:19302"}]`.
Without it, the frontend uses that public STUN server. STUN alone may fail
across restrictive NATs or firewalls; production deployments may need TURN.
The current call does not renegotiate after media failure. A STOMP reconnect
reuses the peer connection and resends an outstanding offer or answer, but
cannot guarantee recovery of ICE candidates lost before delivery.
