/* Comprueba que la reticula del LCD es la misma en toda pantalla.
 *
 * La historia de este archivo tiene dos capitulos.
 *
 * El primero: el punto salia solo del alto, asi que las columnas quedaban a merced
 * de la relacion de aspecto — 230 en un portatil, 256 en una tele, 312 en un movil
 * y 368 con la barra del navegador puesta, contra los 160 de la maquinita. De ancho
 * habia mas del doble de puntos que en una Game Boy y el juego se veia fino en vez
 * de pixelado. Se le puso techo y piso, y el punto pasaba a salir del eje que
 * apretara. Este test comprobaba que ese reparto no se desmadrara.
 *
 * El segundo, que es lo que comprueba ahora: el reparto seguia dando una reticula
 * DISTINTA en cada aparato (200x113 en una tele, 225x104 en un movil), y con ella
 * cambiaba cuanto mundo entraba en cuadro. O sea que el juego no se veia igual ni
 * se jugaba igual segun donde lo abrieras. Ahora la reticula esta clavada en
 * 192x108 y el lienzo se encoge al mayor 16:9 que entre; lo que sobra queda negro.
 *
 * 192x108 no se eligio: es la unica que cabe. 16:9 exacto pide filas multiplo de 9,
 * y entre el techo de ~200 columnas (mas se ve fino) y el piso de 104 filas (menos
 * y la interfaz no entra) no queda ninguna otra: 176x99 rompe la interfaz y 208x117
 * se pasa de ancho.
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
  ['cuadrada 4:3',      800,  600, 1],
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
    const cv = document.getElementById('screen');
    return {
      cols: scene.width, rows: scene.height,
      wantCols: CFG.lcdCols, wantRows: CFG.lcdRows,
      pix: PIX, worldW: +W.toFixed(3), worldH: H,
      cssW: parseFloat(cv.style.width), cssH: parseFloat(cv.style.height),
    };
  });
  await page.waitForTimeout(400);
  // cuantas filas del top 10 llegaron a dibujarse
  const shown = await page.evaluate(() => Menu.scoresShown);
  seen.push({ name, ...m, vw: w, vh: h, shown, errors });
  await page.close();
}

console.log('\nla reticula es la misma en todas');
for (const v of seen) {
  check(`${v.name}: ${v.cols}x${v.rows}`,
        v.cols === v.wantCols && v.rows === v.wantRows,
        `esperaba ${v.wantCols}x${v.wantRows}`);
}

console.log('\ny tambien el mundo: mismo alto y mismo ancho');
{
  const first = seen[0];
  for (const v of seen) {
    check(`${v.name}: mundo ${v.worldW}x${v.worldH}`,
          v.worldW === first.worldW && v.worldH === first.worldH,
          `contra ${first.worldW}x${first.worldH} de ${first.name}`);
  }
  // Si el mundo cambiara de ancho, cambiaria cuanto sitio hay para esquivar y el
  // juego seria mas facil en un monitor ancho. Es la razon de fondo del bloqueo.
  check('el mundo es 16:9 exacto', Math.abs(first.worldW / first.worldH - 16 / 9) < 1e-6,
        (first.worldW / first.worldH).toFixed(6));
  check('y el punto del LCD tambien es constante',
        seen.every(v => Math.abs(v.pix - first.pix) < 1e-9), first.pix.toFixed(4));
}

console.log('\nel punto sigue siendo cuadrado');
for (const v of seen) {
  // El lienzo en CSS y la reticula tienen que tener la misma relacion: si no, el
  // punto se estira y deja de ser un punto.
  check(`${v.name}: lienzo ${v.cssW}x${v.cssH}`,
        Math.abs((v.cssW / v.cssH) - (v.cols / v.rows)) < 0.02,
        `${(v.cssW / v.cssH).toFixed(3)} contra ${(v.cols / v.rows).toFixed(3)}`);
}

console.log('\nel lienzo es el mayor 16:9 que entra');
for (const v of seen) {
  check(`${v.name}: ${v.cssW}x${v.cssH} en ${v.vw}x${v.vh}`,
        v.cssW <= v.vw && v.cssH <= v.vh && (v.cssW === v.vw || v.cssH === v.vh));
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
