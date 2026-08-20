/* El cartucho: media/cartridge.png, 900x1030.
 *
 * Es una maqueta, no una foto: el juego es una web y no existe en plastico. Pero
 * la etiqueta si es el juego —la misma escena de la portada (dev/cover-art.mjs),
 * dibujada por el propio juego— y esa es toda la gracia de la imagen: enseña de
 * un vistazo que esto va de una maquinita, sin tener que explicarlo.
 *
 * El color entra por donde entraba en la consola: por el vidrio. La escena sigue
 * cuantizada a los mismos cuatro tonos y el shader multiplica el tinte al final,
 * asi que la etiqueta es el juego con el cristal verde puesto (§21.1) — el mismo
 * GREEN que esta escondido en el menu. El plastico del cartucho, en cambio, se
 * dibuja aca con canvas normal: es un objeto fisico, no una pantalla, asi que no
 * pasa por el LCD ni tiene por que respetar sus cuatro tonos.
 *
 * No lleva ni una marca ajena: la forma de un cartucho es la forma de un
 * cartucho, pero los logotipos son de quien son. Lo unico escrito es el nombre
 * del juego, y va dentro de la etiqueta, escrito con la fuente del juego.
 *
 *   node dev/capture-cartridge.mjs
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { serve, playwright, ROOT } from './harness.mjs';
import { LAYOUT, stopLoop, compose, check } from './cover-art.mjs';

const OUT = join(ROOT, 'media');

// La etiqueta se dibuja 1:1 con la imagen del LCD: 630x500 puntos de pantalla,
// sin reescalar. Reescalarla seria volver a inventar medios tonos, que es
// justamente lo que estas capturas existen para no hacer.
const CART = {
  w: 900, h: 1030,                 // el lienzo entero, con aire para la sombra
  x: 60, y: 44, cw: 780, ch: 912,  // el cartucho: proporcion 57x65 mm, la de verdad
  cut: 120,                        // el bisel de la esquina de arriba a la derecha
  round: 26,
  label: { x: 135, y: 268, w: 630, h: 500, pad: 16 },
  ridges: { top: 96, n: 4, h: 16, gap: 14, x: 104, right: 104 },
  // El escalon de abajo, que es de donde se tira para sacarlo: en el cartucho de
  // verdad ese trozo sobresale, y es lo que termina de dar la silueta.
  grip: { top: 130, inset: 16 },
};

const ART = { ...LAYOUT, tint: 'GREEN', dataUrl: true };

const { chromium } = playwright();
const { server, base } = await serve();
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: CART.w, height: CART.h },
  deviceScaleFactor: 1,
  hasTouch: true,
});
const page = await ctx.newPage();
await page.goto(`${base}/index.html`, { waitUntil: 'load' });
await page.waitForTimeout(600);

await page.evaluate(stopLoop);
await page.waitForTimeout(150);
const shot = await page.evaluate(compose, ART);

const bad = check(shot, ART);
if (bad) { console.error(bad); process.exit(1); }

await page.evaluate(async ({ C, art }) => {
  cv.style.display = 'none';                 // la pantalla del juego se aparta: ya dio su imagen
  const c = document.createElement('canvas');
  c.width = C.w; c.height = C.h;
  Object.assign(c.style, { position: 'fixed', left: '0', top: '0',
                           width: C.w + 'px', height: C.h + 'px' });
  document.body.appendChild(c);
  const g = c.getContext('2d');

  const x0 = C.x, y0 = C.y, x1 = C.x + C.cw, y1 = C.y + C.ch;

  // El contorno del cartucho: esquinas redondeadas y, arriba a la derecha, el
  // bisel que impide meterlo del reves. Es lo unico que hace falta para que la
  // silueta se reconozca.
  const shell = () => {
    g.beginPath();
    g.moveTo(x0 + C.round, y0);
    g.lineTo(x1 - C.cut, y0);
    g.lineTo(x1, y0 + C.cut);
    g.lineTo(x1, y1 - C.round);
    g.arcTo(x1, y1, x1 - C.round, y1, C.round);
    g.lineTo(x0 + C.round, y1);
    g.arcTo(x0, y1, x0, y1 - C.round, C.round);
    g.lineTo(x0, y0 + C.round);
    g.arcTo(x0, y0, x0 + C.round, y0, C.round);
    g.closePath();
  };

  const round = (x, y, w, h, r) => {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };

  // fondo: un gris muy oscuro, apenas iluminado detras del cartucho
  const bg = g.createRadialGradient(C.w / 2, C.h * 0.38, 40, C.w / 2, C.h * 0.5, C.h * 0.85);
  bg.addColorStop(0, '#22262b');
  bg.addColorStop(1, '#0a0c0e');
  g.fillStyle = bg;
  g.fillRect(0, 0, C.w, C.h);

  // la sombra del cartucho sobre el fondo
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.65)';
  g.shadowBlur = 46;
  g.shadowOffsetY = 26;
  shell();
  g.fillStyle = '#c6c2b6';
  g.fill();
  g.restore();

  // el plastico: gris calido, con la luz entrando por la izquierda
  const body = g.createLinearGradient(x0, y0, x1, y1);
  body.addColorStop(0, '#d7d2c3');
  body.addColorStop(0.35, '#c4bfae');
  body.addColorStop(0.75, '#b2ac99');
  body.addColorStop(1, '#96907e');
  shell();
  g.fillStyle = body;
  g.fill();
  g.save();
  shell();
  g.clip();
  g.strokeStyle = 'rgba(255,255,255,0.55)';   // bisel claro por dentro del borde
  g.lineWidth = 4;
  g.stroke();
  g.restore();
  shell();
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  g.lineWidth = 2;
  g.stroke();

  // un brillo diagonal, flojo: el plastico no es mate del todo y sin esto la
  // pieza se ve como un recorte de papel
  g.save();
  shell();
  g.clip();
  const sheen = g.createLinearGradient(x0, y0, x0 + C.cw * 0.9, y1);
  sheen.addColorStop(0, 'rgba(255,255,255,0.22)');
  sheen.addColorStop(0.35, 'rgba(255,255,255,0.04)');
  sheen.addColorStop(0.36, 'rgba(0,0,0,0.00)');
  sheen.addColorStop(1, 'rgba(0,0,0,0.10)');
  g.fillStyle = sheen;
  g.fillRect(x0, y0, C.cw, C.ch);
  g.restore();

  // las estrias de agarre de arriba. Las de mas arriba se cortan contra el
  // bisel, como en el cartucho de verdad.
  const R = C.ridges;
  for (let i = 0; i < R.n; i++) {
    const ry = R.top + i * (R.h + R.gap);
    const chamfer = x1 - C.cut + (ry + R.h - y0);       // la diagonal del bisel
    const rx1 = Math.min(x1 - R.right, chamfer - 26);
    round(x0 + R.x, ry, rx1 - (x0 + R.x), R.h, R.h / 2);
    g.fillStyle = 'rgba(0,0,0,0.14)';
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.45)';
    g.lineWidth = 2;
    g.stroke();
  }

  // el hueco de la etiqueta: un escalon hacia dentro, con su sombra
  const L = C.label;
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.45)';
  g.shadowBlur = 14;
  g.shadowOffsetY = 6;
  round(L.x - L.pad, L.y - L.pad, L.w + L.pad * 2, L.h + L.pad * 2, 10);
  g.fillStyle = '#efe9da';                    // el papel de la etiqueta
  g.fill();
  g.restore();
  round(L.x - L.pad, L.y - L.pad, L.w + L.pad * 2, L.h + L.pad * 2, 10);
  g.strokeStyle = 'rgba(0,0,0,0.25)';
  g.lineWidth = 2;
  g.stroke();

  // y dentro, el juego: la misma escena de la portada con el cristal verde
  const img = new Image();
  await new Promise((done, fail) => { img.onload = done; img.onerror = fail; img.src = art; });
  g.imageSmoothingEnabled = false;            // 1:1, sin remuestrear
  g.drawImage(img, L.x, L.y, L.w, L.h);
  g.strokeStyle = 'rgba(0,0,0,0.55)';
  g.lineWidth = 2;
  g.strokeRect(L.x - 1, L.y - 1, L.w + 2, L.h + 2);

  // el escalon de abajo: el trozo que sobresale y del que se tira para sacarlo
  const gy = y1 - C.grip.top, gx = x0 + C.grip.inset;
  g.save();
  shell();
  g.clip();                                   // el escalon no se sale del cuerpo
  round(gx, gy, C.cw - C.grip.inset * 2, C.grip.top + 40, 22);
  const lip = g.createLinearGradient(0, gy, 0, y1);
  lip.addColorStop(0, 'rgba(255,255,255,0.30)');
  lip.addColorStop(0.10, 'rgba(0,0,0,0.10)');
  lip.addColorStop(1, 'rgba(0,0,0,0.02)');
  g.fillStyle = lip;
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.22)';
  g.lineWidth = 2;
  g.stroke();
  g.restore();
}, { C: CART, art: shot.url });

await mkdir(OUT, { recursive: true });
await page.screenshot({ path: join(OUT, 'cartridge.png') });
console.log(`  cartridge.png   ${CART.w}x${CART.h}  (etiqueta ${shot.cw}x${shot.ch}, vidrio ${ART.tint})`);

await browser.close();
server.close();
console.log('\nlisto\n');
