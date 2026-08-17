/* Cuanto puntua el bot jugando con las reglas de todos: dos vidas y sin ayuda.
 *
 * Lo que motiva este archivo: es la unica medida honesta de dificultad que
 * tiene el juego. botControl es el mismo piloto de la demo, asi que su reparto
 * de puntajes dice donde esta puesta la vara — y sirve de numero a superar
 * cuando se sale a pedir que la gente publique su record.
 *
 * No usa la pantalla DEAD: en attract la muerte no termina la partida, la
 * reinicia (§ el bot no entra al top 10). Asi que se mira el puntaje seguido y
 * cada vez que se cae a cero se anota el pico anterior, que es lo que valia esa
 * vuelta.
 *
 *   node dev/bot-score.mjs [segundos]      (por defecto 480)
 */
import { serve, playwright, KNOWN_NOISE } from './harness.mjs';

const SECONDS = Number(process.argv[2]) || 480;

const { chromium } = playwright();
const { server, base } = await serve();
const browser = await chromium.launch();
const page = await (await browser.newContext({
  viewport: { width: 768, height: 576 }, hasTouch: true,
})).newPage();
page.on('pageerror', e => { if (!KNOWN_NOISE(e)) console.error('error de pagina:', String(e)); });
await page.goto(`${base}/index.html`, { waitUntil: 'load' });
await page.waitForTimeout(500);

// PLAY con attract: el bot a los mandos, pero con las vidas de siempre.
await page.evaluate(() => { Sfx.quiet = true; startGame('play'); G.attract = true; });

const runs = [];
let peak = 0;
const t0 = Date.now();
while (Date.now() - t0 < SECONDS * 1000) {
  const s = await page.evaluate(() => G.score);
  if (s < peak - 1) { runs.push(Math.floor(peak)); peak = s; }   // volvio a empezar
  else peak = Math.max(peak, s);
  await page.waitForTimeout(120);
}

await browser.close();
server.close();

if (!runs.length) { console.log('\nninguna partida termino en el tiempo dado\n'); process.exit(1); }

runs.sort((a, b) => a - b);
const sum = runs.reduce((a, b) => a + b, 0);
const at = q => runs[Math.min(runs.length - 1, Math.floor(q * runs.length))];

console.log(`\n${runs.length} partidas en ${SECONDS}s`);
console.log(`  peor      ${runs[0]}`);
console.log(`  mediana   ${at(0.5)}`);
console.log(`  promedio  ${Math.round(sum / runs.length)}`);
console.log(`  top 10%   ${at(0.9)}`);
console.log(`  mejor     ${runs[runs.length - 1]}`);
console.log(`\n  todas: ${runs.join(' ')}\n`);
