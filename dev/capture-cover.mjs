/* La portada de itch.io: media/cover.png, 630x500.
 *
 * La escena, y el porque de cada numero, estan en dev/cover-art.mjs: la dibuja
 * el juego con sus propias piezas. Aca solo se abre el navegador del tamano
 * justo —un pixel de imagen por pixel de pantalla— y se aprieta el obturador.
 *
 *   node dev/capture-cover.mjs
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { serve, playwright, ROOT } from './harness.mjs';
import { LAYOUT, stopLoop, compose, check } from './cover-art.mjs';

const OUT = join(ROOT, 'media');
const COVER = { ...LAYOUT };

const { chromium } = playwright();
const { server, base } = await serve();
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: COVER.cols * COVER.cell, height: COVER.rows * COVER.cell },
  deviceScaleFactor: 1,           // un pixel de imagen = un pixel de pantalla
  hasTouch: true,
});
const page = await ctx.newPage();
await page.goto(`${base}/index.html`, { waitUntil: 'load' });
await page.waitForTimeout(600);

await page.evaluate(stopLoop);
await page.waitForTimeout(150);
const shot = await page.evaluate(compose, COVER);

const bad = check(shot, COVER);
if (bad) { console.error(bad); process.exit(1); }

await mkdir(OUT, { recursive: true });
await page.screenshot({ path: join(OUT, 'cover.png') });
console.log(`  cover.png   ${shot.cw}x${shot.ch}  (${shot.cols}x${shot.rows} puntos de ${COVER.cell} px)`);

await browser.close();
server.close();
console.log('\nlisto\n');
