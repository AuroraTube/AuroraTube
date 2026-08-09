# AuroraTube

Cloudflare Worker + React SPA: privacy-oriented YouTube frontend.

## Stack

- Worker: Hono on Cloudflare Workers (`src/app.ts`)
- Catalog (search / channel / playlist / trending): Invidious instance pool
- Watch metadata: SiaTube
- Comments: SiaTube → Invidious fallback
- Stream cascade: SiaTube → RapidAPI YTStream → getlate (360p)
- Client: React 18 + Vite + Tailwind + hls.js

## Scripts

```bash
npm install
npm run dev        # Vite client
npm run build      # client → dist/
npm run deploy     # build + wrangler deploy
npm run typecheck
```

## Notes

### RapidAPI keys

Keys are fixed in `src/lib/stream/fallback/rapidapi/config.ts` and rotated at request time.
Logs must only emit `maskSecret` hints (`keyHint`), never raw keys.

### Invidious instance list

Instances are listed in `src/lib/config.ts` (`INVIDIOUS_INSTANCES`). The upstream pool applies
failure / rate-limit cooldowns (`src/lib/upstream/`). Dead or hostile instances should be
removed or reordered via ops review; there is no automatic discovery. Prefer instances that:

- stay reachable under the configured JSON timeout
- do not require auth cookies for public API paths
- return stable `/api/v1/*` shapes used by transformers

Periodic health is exposed at `/api/health` (`probeUpstreams`).
