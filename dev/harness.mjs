/* Lo que comparten dev/audio-test.mjs y dev/input-test.mjs: servir el repo y abrir
 * Chromium. El repo no tiene package.json a proposito (juego de un solo archivo, cero
 * dependencias), asi que Playwright se resuelve desde donde este instalado.
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const require = createRequire(import.meta.url);
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function playwright() {
  try { return require('playwright'); } catch {}
  try { return require(join(execSync('npm root -g').toString().trim(), 'playwright')); }
  catch {
    console.error('Falta Playwright. Instalalo con:  npm i -g playwright');
    process.exit(2);
  }
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
               '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

// index.html registra un service worker; sobre file:// eso falla y ensucia la consola.
export async function serve() {
  const server = createServer(async (req, res) => {
    const path = join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
    try {
      const body = await readFile(path);
      res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404).end('no'); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

export function reporter() {
  const state = { failed: 0 };
  return [state, (name, ok, detail) => {
    console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? '   ' + detail : ''}`);
    if (!ok) state.failed++;
  }];
}

// sw.js responde con index.html a CUALQUIER GET que falle, incluido el PeerJS de unpkg
// cuando no hay red, y el navegador intenta parsear ese HTML como JavaScript. Es un fallo
// previo y ajeno a lo que miden estos tests.
export const KNOWN_NOISE = e => String(e).includes("Unexpected token '<'");
