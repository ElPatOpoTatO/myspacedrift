/* Comprueba el audio sin que nadie escuche.
 *
 * Renderiza cada sonido con OfflineAudioContext y afirma sobre las muestras: que suena,
 * que dura lo que debe, que no satura y que no tiene energia por debajo del suelo LCD.
 * No mide gusto — para eso esta dev/audio-lab.html, que hay que escuchar.
 *
 *   node dev/audio-test.mjs
 *
 * El repo no tiene package.json a proposito (juego de un solo archivo, cero dependencias),
 * asi que Playwright se resuelve desde donde este instalado, incluido el global de npm.
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  try {
    ({ chromium } = require(join(execSync('npm root -g').toString().trim(), 'playwright')));
  } catch {
    console.error('Falta Playwright. Instalalo con:  npm i -g playwright');
    process.exit(2);
  }
}

/* ---------------------------------------------------------------- servidor */
// index.html registra un service worker; sobre file:// eso falla y ensucia la consola.
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png',
               '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  const path = join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  try {
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404).end('no'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/index.html`;

/* -------------------------------------------------------------- esperado */
// Duraciones nominales en segundos, derivadas de las tablas de notas del modulo.
const SOUNDS = {
  ui:      0.018,
  shoot:   0.024,   // 3 x 8 ms
  destroy: 0.180,   // 12 x 15 ms
  pickup:  0.120,   // 3 x 40 ms
  repair:  0.255,   // 55+55+55+90
  damage:  0.200,   // 45+45+110
  death:   0.950,   // 90x7 + 320
  level:   0.350,   // 70x3 + 140
};
const FLOOR_HZ = 380;
const SR = 44100;
// Un tono de F Hz no puede mantener el mismo signo mas de SR/(2F) muestras seguidas.
// Si alguna racha lo supera, se ha colado energia por debajo del suelo.
const MAX_RUN = Math.ceil((SR / (2 * FLOOR_HZ)) * 1.25);

/* ---------------------------------------------------------------- navegador */
const browser = await chromium.launch();
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', e => {
  // Fallo previo y ajeno al audio: sw.js responde con index.html a CUALQUIER GET que
  // falle, incluido el PeerJS de unpkg cuando no hay red, y el navegador intenta parsear
  // ese HTML como JavaScript. Pasa igual sin estos cambios, asi que no cuenta aqui.
  const s = String(e);
  if (!s.includes("Unexpected token '<'")) pageErrors.push(s);
});
await page.goto(BASE, { waitUntil: 'load' });

// Se ejecuta dentro de la pagina: renderiza un sonido a PCM y devuelve estadisticas.
const probe = async (calls, seconds, opts = {}) => page.evaluate(async ([calls, seconds, opts]) => {
  const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const oc = new OC(1, Math.ceil(44100 * seconds), 44100);
  window.Sfx.init(oc);                       // pasarle un contexto rehace el modulo sobre el
  window.Sfx.quiet = !!opts.quiet;
  if (opts.muted && !window.Sfx.muted) window.Sfx.toggleMute();
  if (!opts.muted && window.Sfx.muted) window.Sfx.toggleMute();
  for (const c of calls) c === 'engine' ? window.Sfx.engine(true) : window.Sfx[c]();

  const d = (await oc.startRendering()).getChannelData(0);
  let peak = 0, lastHot = -1;
  for (let i = 0; i < d.length; i++) {
    const a = Math.abs(d[i]);
    if (a > peak) peak = a;
  }
  const gate = Math.max(peak * 0.05, 1e-5);
  let run = 0, maxRun = 0, sign = 0;
  for (let i = 0; i < d.length; i++) {
    const v = d[i];
    if (Math.abs(v) > gate) {
      lastHot = i;
      const s = v > 0 ? 1 : -1;
      run = s === sign ? run + 1 : 1;
      sign = s;
      if (run > maxRun) maxRun = run;
    } else { run = 0; sign = 0; }
  }
  return { peak, maxRun, dur: lastHot < 0 ? 0 : (lastHot + 1) / 44100 };
}, [calls, seconds, opts]);

/* ---------------------------------------------------------------- aserciones */
let failed = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? '   ' + detail : ''}`);
  if (!ok) failed++;
};

console.log('\nsonidos');
for (const [name, want] of Object.entries(SOUNDS)) {
  const r = await probe([name], want + 0.3);
  const ratio = r.dur / want;
  check(`${name} suena`, r.peak > 0.001, `pico ${r.peak.toFixed(3)}`);
  check(`${name} dura ~${(want * 1000) | 0} ms`, ratio > 0.75 && ratio < 1.25,
        `real ${(r.dur * 1000) | 0} ms`);
  check(`${name} sin graves bajo ${FLOOR_HZ} Hz`, r.maxRun > 0 && r.maxRun <= MAX_RUN,
        `racha ${r.maxRun} <= ${MAX_RUN}`);
}

console.log('\nmotor');
{
  const r = await probe(['engine'], 0.5);
  check('el motor suena', r.peak > 0.001, `pico ${r.peak.toFixed(3)}`);
  check(`el motor sin graves bajo ${FLOOR_HZ} Hz`, r.maxRun > 0 && r.maxRun <= MAX_RUN,
        `racha ${r.maxRun} <= ${MAX_RUN}`);
}

console.log('\nmezcla');
{
  const all = Object.keys(SOUNDS).concat('engine');
  const r = await probe(all, 1.3);
  check('todo a la vez no satura', r.peak <= 1.0, `pico ${r.peak.toFixed(3)}`);
}

console.log('\nsilencios');
{
  const q = await probe(['shoot', 'destroy', 'damage', 'death', 'level', 'pickup', 'repair', 'engine'],
                        1.3, { quiet: true });
  check('quiet calla la simulacion', q.peak < 1e-6, `pico ${q.peak.toExponential(1)}`);
  const qui = await probe(['ui'], 0.3, { quiet: true });
  check('quiet NO calla el clic de interfaz', qui.peak > 0.001, `pico ${qui.peak.toFixed(3)}`);
  const m = await probe(['ui', 'shoot', 'death', 'engine'], 1.3, { muted: true });
  check('mute lo calla todo', m.peak < 1e-6, `pico ${m.peak.toExponential(1)}`);
}

console.log('\napi');
{
  const api = await page.evaluate(() => ({
    keys: Object.keys(window.Sfx).sort(),
    hasSplit: typeof window.Sfx.split === 'function',
    tones: window.Sfx.tones,
  }));
  check('split ya no existe', !api.hasSplit);
  check('la paleta esta sobre el suelo', api.tones.every(t => t >= FLOOR_HZ),
        `min ${Math.min(...api.tones)} Hz`);
  for (const k of ['init', 'resume', 'engine', 'toggleMute', ...Object.keys(SOUNDS)]) {
    check(`expone ${k}`, api.keys.includes(k));
  }
}

console.log('\nsesion');
{
  const muted = () => page.evaluate(() => { window.Sfx.init(); return window.Sfx.muted; });
  await page.evaluate(() => { window.Sfx.init(); if (window.Sfx.muted) window.Sfx.toggleMute(); });

  await page.evaluate(() => window.Sfx.toggleMute());
  await page.reload({ waitUntil: 'load' });
  check('el mute sobrevive a recargar', (await muted()) === true);

  await page.evaluate(() => window.Sfx.toggleMute());
  await page.reload({ waitUntil: 'load' });
  check('y el des-mute tambien', (await muted()) === false);

  const demo = await page.evaluate(() => {
    window.Sfx.init(); startGame(true);
    return { quiet: window.Sfx.quiet, attract: G.attract };
  });
  check('la demo del menu se calla sola', demo.quiet === true && demo.attract === true);
  const play = await page.evaluate(() => { startGame(false); return window.Sfx.quiet; });
  check('una partida real no esta en quiet', play === false);
}

check('la pagina no lanzo errores', pageErrors.length === 0, pageErrors.join(' | '));

await browser.close();
server.close();
console.log(failed ? `\n${failed} fallo(s)\n` : '\ntodo correcto\n');
process.exit(failed ? 1 : 0);
