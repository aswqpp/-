/**
 * Worker entry. Static files (the built client) are served by Workers
 * Assets before this code runs; only /api/* reaches here.
 *
 *   POST /api/rooms            → { code }   create a room with a fresh code
 *   GET  /api/rooms/:code/ws   → WebSocket  join / rejoin a room
 */
import { CODE_ALPHABET, CODE_LENGTH, normalizeCode } from '../shared/protocol';

export { Room } from './room';

function randomCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/rooms' && request.method === 'POST') {
      for (let attempt = 0; attempt < 8; attempt++) {
        const code = randomCode();
        const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
        if (await stub.init(code)) return json({ code });
      }
      return json({ error: 'NO FREE CODE, TRY AGAIN' }, 503);
    }

    const m = path.match(/^\/api\/rooms\/([^/]+)\/ws$/);
    if (m) {
      const code = normalizeCode(decodeURIComponent(m[1]));
      if (!code) return json({ error: 'BAD CODE' }, 400);
      if (request.headers.get('Upgrade') !== 'websocket') return json({ error: 'EXPECTED WEBSOCKET' }, 426);
      const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
      return stub.fetch(request);
    }

    if (path.startsWith('/api/')) return json({ error: 'NOT FOUND' }, 404);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
