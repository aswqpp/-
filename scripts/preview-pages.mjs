/**
 * Serves the production build exactly the way GitHub Pages will: as plain static
 * files under the /-/ sub-path.
 *
 * `vite preview` is not a faithful stand-in here — its dev middleware 404s requests
 * carrying `Sec-Fetch-Dest: script` once a non-root base is configured, which every
 * browser sends for the entry module. Pages is a dumb static host, so this is closer
 * to production anyway.
 */
import { createServer } from 'node:http';
import { readFile, access } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const PORT = Number(process.env.PORT ?? 4173);
const BASE = '/-/';
const DIST = new URL('../dist/', import.meta.url).pathname;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (!url.pathname.startsWith(BASE)) {
    res.writeHead(302, { Location: BASE }).end();
    return;
  }

  // Strip the base, then normalize to keep `..` from escaping dist.
  // normalize('') returns '.', so treat directory-ish paths as index.html up front.
  const raw = url.pathname.slice(BASE.length);
  const rel = raw === '' || raw.endsWith('/') ? `${raw}index.html` : raw;
  const safe = normalize(rel).replace(/^(\.\.[/\\])+/, '');
  let file = join(DIST, safe);

  try {
    await access(file);
  } catch {
    file = join(DIST, 'index.html'); // SPA fallback
  }

  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`GitHub Pages 미리보기: http://localhost:${PORT}${BASE}`);
});
