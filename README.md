# An:me

An:me is a Next.js 16 anime discovery and playback interface powered by AniList, with authentication, watchlists, watch history, episode-aware SUB/DUB availability, and real-time Watch Together rooms.

## Local development

Copy `.env.example` to `.env.local` and configure Turso. The app creates its authentication tables automatically.

```bash
npm install
npm run dev
```

The web app runs at `http://localhost:3001`.

Watch Together is served by the app itself at `/api/ws`. It uses Vercel's WebSocket Functions beta in production, so no second service is required.

## Production deployment

Import the repository into Vercel with the standard Next.js preset and set:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `WATCH_TOGETHER_SECRET` — a long random secret used to sign room identities
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — shared Watch Together room state across Vercel instances

Vercel uses the standard `next build` and `next start` scripts. Fluid compute must remain enabled for WebSocket Functions. The client connects to the same deployment at `/api/ws`; no Render, Railway, or public WebSocket URL is needed.

Watch Together room state is mirrored to Upstash Redis with a six-hour TTL so reconnects and host transfers continue across Vercel Function instances. Ending a room deletes its Redis key immediately.

## Watch Together security

- The Next.js API issues short-lived HMAC-signed participant identities.
- The Vercel WebSocket Function validates identities and room codes server-side.
- The server, not the client, owns room membership and playback state.
- Only the actual host identity may publish playback commands, transfer host, or end a room.
- Chat and room actions are rate-limited, chat is length-limited and sanitized, and rooms expire after six hours.
- Disconnected hosts receive a reconnect grace period, then host ownership transfers to an online participant or the room ends safely.

## Verification

```bash
npm run build
npm run lint
```
