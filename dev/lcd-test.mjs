/* Comprueba el tamano de la reticula del LCD en pantallas de toda forma.
 *
 * El fallo que motiva este archivo: el punto salia solo del alto, asi que las
 * columnas quedaban a merced de la relacion de aspecto — 230 en un portatil,
 * 256 en una tele, 312 en un movil y 368 con la barra del navegador puesta,
 * contra los 160 de la maquinita. De ancho habia mas del doble de puntos de los
 * que tiene una Game Boy y el juego se veia fino en vez de pixelado.
 *
 * Ahora el punto sale del eje que apriete: el alto en una pantalla angosta, el
 * tope de columnas en una ancha, y el piso de filas corta al tope cuando la
 * pantalla es tan ancha que ya no entraria el menu.
 *
 *   node dev/lcd-test.mjs
 */
import { serve, playwright, reporter, KNOWN_NOISE } from './harness.mjs';

const { chromium } = playwright();
const { server, base } = await serve();
const [res, check] = reporter();

const browser = await chromium.launch();

// Pantallas reales, de la mas cuadrada a la mas apaisada.
const VIEWPORTS = [
  ['tele 16:9',        1920, 1080, 1],
  ['portatil 16:10',   1440,  900, 2],
  ['movil horizontal',  844,  390, 3],
  ['movil con barra',   844,  330, 3],
  ['ultrapanoramica',  2560, 1080, 1],
];

const seen = [];
for (const [name, w, h, dpr] of VIEWPORTS) {
  const page = await (await browser.newContext({
    viewport: { width: w, height: h }, deviceScaleFactor: dpr,
  })).newPage();
  const errors = [];
  page.on('pageerror', e => { if (!KNOWN_NOISE(e)) errors.push(String(e)); });
  await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(400);

  const m = await page.evaluate(() => {
    // el top 10 lleno, para ver si entran las diez filas
    hs.list = Array.from({ length: 10 }, (_, i) => ({ i: 'ABC', s: 99999 - i * 1111, l: 12 - i }));
    screen = SCREEN.SCORES;
    return {
      cols: scene.width, rows: scene.height,
      cap: CFG.lcdCols, floor: CFG.lcdRowsMin, top: CFG.lcdRows,
      // punto cuadrado: el mismo PIX manda en los dos ejes
      aspecto: (W / H).toFixed(3), reticula: (scene.width / scene.height).toFixed(3),
    };
  });
  await page.waitForTimeout(400);
  // cuantas filas del top 10 llegaron a dibujarse
  const shown = await page.evaluate(() => Menu.scoresShown);
  seen.push({ name, ...m, shown, errors });
  await page.close();
}

console.log('\nla reticula no se desmadra de ancho');
for (const v of seen) {
  // El tope manda salvo cuando el piso de filas lo levanta: ahi las columnas
  // suben, pero solo hasta lo que da el piso (cols = aspecto * filas).
  const techo = Math.max(v.cap, Math.round(parseFloat(v.aspecto) * v.floor) + 1);
  check(`${v.name}: ${v.cols}x${v.rows}`, v.cols <= techo, `tope ${techo}`);
}

console.log('\nlas filas quedan entre el piso y las 144 del hardware');
for (const v of seen) {
  check(`${v.name}: ${v.rows} filas`, v.rows >= v.floor && v.rows <= v.top,
        `piso ${v.floor}, techo ${v.top}`);
}

console.log('\nel punto sigue siendo cuadrado');
for (const v of seen) {
  check(`${v.name}: reticula ${v.reticula} vs pantalla ${v.aspecto}`,
        Math.abs(parseFloat(v.reticula) - parseFloat(v.aspecto)) < 0.02);
}

console.log('\nel top 10 entra entero en todas');
for (const v of seen) {
  check(`${v.name}: ${v.shown} de 10`, v.shown === 10);
}

console.log('\nsin errores de pagina');
for (const v of seen) check(v.name, v.errors.length === 0, v.errors[0] || '');

await browser.close();
server.close();
console.log(res.failed ? `\n${res.failed} fallo/s` : '\ntodo correcto');
process.exit(res.failed ? 1 : 0);
