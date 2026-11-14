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

Set `VITE_WEBRTC_ICE_SERVERS` as a **frontend Docker build argument** before
building the image. The Dockerfile already accepts it. For example:
`[{"urls":"stun:stun.l.google.com:19302"},{"urls":"turns:turn.example.com:5349?transport=tcp","username":"TURN_USER","credential":"TURN_PASSWORD"}]`.
Use a TURN server reachable by both browsers, with its relay ports open. The
frontend bundle includes these credentials, so prefer short-lived TURN
credentials from your provider. A runtime environment change in the Nginx
container does not update a bundle already built by Vite; rebuild and redeploy
the frontend after changing this value. Without TURN, the frontend uses public
STUN only, which cannot relay media when direct ICE connectivity is blocked.
The call retries transient offer, answer, and ICE signaling while connecting.
