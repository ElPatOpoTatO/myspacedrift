/* Comprueba que la estela fantasma mide lo mismo vaya el aparato a los cuadros
 * que vaya.
 *
 * El fallo que motiva este archivo: VRAM.fade se apagaba por CUADRO y no por
 * tiempo, asi que el largo del rastro se media en cuadros y no en milimetros de
 * pantalla. A 60 cuadros por segundo la roca avanza una celda por cuadro y las
 * tres generaciones del fantasma se tocan, que es el rastro que se busca; si el
 * aparato tironea la roca salta el triple pero el fantasma sigue durando tres
 * cuadros, asi que el rastro se estira a nueve celdas y las generaciones quedan
 * separadas por huecos: dejan de leerse como estela y se leen como copias
 * sueltas de la roca al lado de la roca.
 *
 *   node dev/trail-test.mjs
 */
import { serve, playwright, reporter, KNOWN_NOISE } from './harness.mjs';

const { chromium } = playwright();
const { server, base } = await serve();
const [res, check] = reporter();

const browser = await chromium.launch();
const page = await (await browser.newContext({
  viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1,
})).newPage();
const errors = [];
page.on('pageerror', e => { if (!KNOWN_NOISE(e)) errors.push(String(e)); });
await page.goto(`${base}/index.html`, { waitUntil: 'load' });
await page.waitForTimeout(400);

// Un punto solo, corriendo en horizontal a una velocidad conocida, y encima el
// mismo apagado que usa el mundo. Sin poligono de por medio el rastro que queda
// detras es exactamente lo que dura el fantasma.
const trail = await page.evaluate(() => {
  const speed = CFG.meteorSpeedMax * 1.55;          // roca rapida de nivel alto
  const run = (fps) => {
    const dt = 1 / fps;
    VRAM.clear();
    let x = 40;
    for (let f = 0; f < 40; f++) {
      VRAM.fade(CFG.trailFade, dt);
      VRAM.plot(Math.round(x * PIX), 60, 1);
      x += speed * dt;
    }
    VRAM.blit(1, 0);
    const head = Math.round(x - speed * dt);        // ultima posicion dibujada
    const x1 = Math.round(head * PIX);
    const d = tctx.getImageData(x1 - 20, 60, 21, 1).data;
    let cells = '';
    for (let i = 0; i <= 20; i++) cells += d[i * 4 + 3] === 0 ? '.' : '#';
    return { fps, cells, len: cells.length - cells.indexOf('#'),
             adelanto: +(speed * PIX * dt).toFixed(2) };
  };
  return [60, 30, 20].map(run);
});

// A 60 el fantasma dura tres generaciones de ~1 celda: unas 3-4 celdas de rastro.
// Ese es el largo de diseno y ninguna tasa de cuadros puede pasarlo.
const ref = trail.find(t => t.fps === 60).len;

console.log('\nel largo del rastro no depende de los cuadros por segundo');
for (const t of trail) {
  check(`a ${t.fps} cuadros por segundo (${t.adelanto} celdas de avance)`,
        t.len <= ref + 1, `${t.cells}  ${t.len} celdas de rastro, tope ${ref + 1}`);
}

console.log('\ny sigue habiendo estela, no un punto pelado');
check('a 60 quedan varias celdas de rastro', ref >= 3, `${ref} celdas`);

check('la pagina no lanzo errores', errors.length === 0, errors[0] || '');

await browser.close();
server.close();
console.log(res.failed ? `\n${res.failed} fallo/s` : '\ntodo correcto');
process.exit(res.failed ? 1 : 0);
