# Signify-FE deployment

The production image builds the Vite browser application and serves `dist/` with Nginx on port 80. `VITE_API_BASE_URL` is required at build time and is public in the resulting JavaScript. Use `https://api.hood.io.vn` for production. REST calls target `/api/*` on that origin; STOMP uses `wss://api.hood.io.vn/ws/chat` with the existing bearer token in its CONNECT frame.

## Dokploy and GitHub setup

1. Create a **new** Dokploy Application named `signify-fe`, with Docker Image as its source. Set its image initially to `docker.io/ghuy1506/signify-fe:latest`, container port to `80`, and add the domain `signify.hood.io.vn`. Enable HTTPS with a Let's Encrypt certificate. The image is built by GitHub Actions; do not enable Git source builds for this application.
2. Point the DNS A/AAAA record for `signify.hood.io.vn` at the Dokploy VPS. Ensure ports 80 and 443 reach Traefik so certificate issuance and HTTPS work. Configure a separate FE application ID; the Signify-BE ID must not be reused.
3. Set GitHub repository secrets `DOCKERHUB_USERNAME` (`ghuy1506`), `DOCKERHUB_REGISTRY` (`docker.io`), `DOCKERHUB_TOKEN`, `DOKPLOY_URL` (HTTPS Dokploy origin), `DOKPLOY_API_KEY`, and `DOKPLOY_APPLICATION_ID` (the FE application ID). Set repository variable `VITE_API_BASE_URL` to `https://api.hood.io.vn`.
4. Push to `main` or manually run the workflow on `main`. CI checks types, unit tests, and the build. After CI passes, the workflow pushes `latest` and a full commit SHA tag, checks that the commit still heads `main`, updates Dokploy to the SHA image, and requests deployment. Pull requests run CI only.
5. Configure the Signify-BE runtime environment with `CORS_ALLOWED_ORIGINS=https://signify.hood.io.vn` (include other allowed origins as a comma-separated list if needed). The backend's `/ws/chat` handshake and STOMP authentication must remain available through Traefik with WebSocket upgrades enabled.

Dokploy's documented API supports `POST /api/application.update` with `applicationId` and `dockerImage`, followed by `POST /api/application.deploy` with `applicationId`. Both use the `x-api-key` header. See the [application API reference](https://docs.dokploy.com/docs/api/application).

## Translation endpoint dependency

`LanguagePacks.tsx` and `VideoCall.tsx` call same-origin `/api/translate`. That route exists only in this repository's `server.ts`, where it calls Gemini using a private `GEMINI_API_KEY`. The Nginx static image does not run `server.ts`; `/api/translate` therefore returns an explicit 503. Restore this feature by deploying the existing Express handler as a separate protected service behind the frontend domain or by migrating its contract to an existing backend service, then route `/api/translate` to that service. Do not place `GEMINI_API_KEY` in any `VITE_*` variable or Docker build argument. The current Signify-BE repository does not expose `/api/translate`.

## WebRTC

The existing client uses public STUN by default. Calls across restrictive NATs may require a TURN service. `VITE_WEBRTC_ICE_SERVERS` can configure public ICE details at build time, but any credentials in it are visible to browser users. Use short-lived TURN credentials if a TURN service is added.
