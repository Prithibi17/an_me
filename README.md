# An:me

An:me is a Next.js 16 anime discovery and playback interface powered by AniList, with authentication, watchlists, watch history, episode-aware SUB/DUB availability, and real-time Watch Together rooms.

## Local development

Copy `.env.example` to `.env.local` and configure Turso. The app creates its authentication tables automatically.

```bash
npm install
npm run dev
```

The web app runs at `http://localhost:3001`.

Watch Together uses a separate authoritative WebSocket gateway. Start it in a second terminal:

```bash
npm run realtime
```

It runs at `ws://localhost:3002/ws`. Both processes must use the same `WATCH_TOGETHER_SECRET`.

## Production deployment

### 1. Real-time gateway

Deploy this repository to a WebSocket-capable Node host such as Render using the included `render.yaml`, or Railway/Fly.io with:

- Build: `npm ci`
- Start: `npm run realtime`
- `WATCH_TOGETHER_SECRET`: a long random secret
- `ALLOWED_ORIGINS`: the exact Vercel URL, plus any custom domains, comma-separated

The service exposes `/` for health checks and `/ws` for WebSocket connections.

### 2. Vercel frontend

Import the repository into Vercel with the standard Next.js preset and set:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `WATCH_TOGETHER_SECRET` — exactly the same value as the real-time gateway
- `NEXT_PUBLIC_WATCH_TOGETHER_WS_URL` — for example `wss://an-me-watch-together.onrender.com/ws`

Vercel uses the standard `next build` and `next start` scripts; no custom Next.js server is required.

## Watch Together security

- The Next.js API issues short-lived HMAC-signed participant identities.
- The gateway validates identities and room codes server-side.
- The server, not the client, owns room membership and playback state.
- Only the actual host identity may publish playback commands, transfer host, or end a room.
- Chat and room actions are rate-limited, chat is length-limited and sanitized, and rooms expire after six hours.
- Disconnected hosts receive a reconnect grace period, then host ownership transfers to an online participant or the room ends safely.

## Verification

```bash
npm run build
npm run lint
```
