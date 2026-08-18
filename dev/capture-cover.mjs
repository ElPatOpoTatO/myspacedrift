/* La portada de itch.io: media/cover.png, 630x500.
 *
 * Lo que motiva este archivo es lo mismo que motiva a capture-media.mjs: el
 * juego no se deja fotografiar a mano. Es un LCD cuantizado a cuatro tonos, y
 * cualquier cosa dibujada fuera —un montaje, un reescalado, una tipografia de
 * verdad— le mete medios tonos y bordes suaves que en el juego no existen. Una
 * portada asi miente sobre lo que se va a ver al apretar PLAY.
 *
 * Asi que la portada la dibuja el juego con sus propias piezas: la nave sale de
 * SHIP_SEGS con sus motores, las rocas de makeRock, el polvo de disintegrate,
 * el cielo de Stars, las letras de Font y los cuatro tonos y la reticula del
 * shader LCD. Aca no se pinta nada: se arma la escena, se la deja correr unos
 * cuadros para que quede la estela, y se aprieta el obturador.
 *
 * Dos numeros mandan sobre el resto:
 *
 *   - 126 x 100 puntos por 5 pixeles de lado son 630 x 500 exactos, que es la
 *     medida que muestra la ficha de itch.io. El punto cae entero: sin eso la
 *     reticula cojea (unas celdas de 3 pixeles y otras de 4) y la portada se ve
 *     sucia justo en lo que la hace reconocible.
 *
 *   - El juego dibuja a 0.3 puntos por unidad de mundo (144 filas sobre las 480
 *     de alto que mide el mundo) y ahi la nave son ocho puntos. En la miniatura
 *     de la tienda eso es una mota. La portada mira el mismo campo mas de cerca
 *     —0.8, dos veces y media— y la nave pasa a veintidos puntos: la misma nave,
 *     el mismo trazo de un punto, la misma fisica; solo cambia a que distancia
 *     se la mira.
 *
 * La escena no es un cuadro robado a una partida: en una partida de verdad la
 * nave esta donde esta, y una portada necesita un sitio libre para el titulo y
 * la nave apuntando hacia adentro. Se colocan las piezas a mano, en puntos de
 * LCD (COVER.scene), y se las deja moverse: lo que se ve es el juego, puesto.
 *
 * Sale siempre igual: el azar va sembrado y el reloj de las estrellas, clavado.
 *
 *   node dev/capture-cover.mjs
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { serve, playwright, ROOT } from './harness.mjs';

const OUT = join(ROOT, 'media');

const COVER = {
  cols: 126, rows: 100, cell: 5,   // 126*5 = 630, 100*5 = 500
  pixel: 0.8,                      // puntos de LCD por unidad de mundo
  seed: 20250818,

  // El titulo va en dos renglones a escala 2: 'MY SPACE DRIFT' de una sola tira
  // mide 167 puntos y no entra en 126, y a escala 1 entra pero en la miniatura
  // de la tienda queda en tres pixeles por letra. Partido, el nombre se lee de
  // lejos, que es lo unico que una portada tiene que resolver.
  title: [['MY SPACE', 6], ['DRIFT', 22]],
  rule: 39,                        // la raya del menu, debajo del titulo
  tag: ['YOU ONLY STEER', 44],     // la frase es del propio juego: cartel 2 de la demo

  // Todo lo de abajo en puntos de LCD; el script lo pasa a unidades de mundo.
  // El reparto es de dos pisos y no de tres a proposito: el nombre y la frase
  // se quedan con la mitad de arriba y el campo entero con la de abajo. Repartir
  // texto arriba Y abajo dejaba el juego en una franja del medio, y ahi la nave
  // volvia a ser una mota, que es lo que esta portada tiene que evitar.
  scene: {
    ship:    { x: 26, y: 74, a: -0.25, speed: 150 },
    rocks: [
      { x: 112, y: 86, r: 16, dir: 2.6, spd: 70 },
      // la del final de la linea de tiro: entera, con la bala encima. Es lo que
      // cuenta el juego en una imagen quieta — nave, disparo y roca — y por eso
      // la roca reventada no va aca sino lejos, de adorno
      { x: 97, y: 61, r: 13, dir: 3.0, spd: 75 },
      { x: 120, y: 55, r: 5, dir: 3.4, spd: 80 },
      { x: 8, y: 59, r: 5, dir: 0.4, spd: 95 },
      { x: 100, y: 97, r: 6, dir: 4.2, spd: 125 },
      // las dos de las esquinas de arriba: el cielo solo, al lado del nombre,
      // queda vacio, y el campo tiene que llegar hasta el borde de la portada
      { x: 5, y: 13, r: 4, dir: 1.1, spd: 120 },
      { x: 121, y: 21, r: 5, dir: 2.2, spd: 130 },
    ],
    // Una roca reventada, abajo a la izquierda: los segmentos sueltos son los
    // que deja disintegrate, o sea la propia roca abierta por sus lados. 'age'
    // es el reloj que se le adelanta para que se vea abriendose.
    burst:   { x: 40, y: 92, r: 8, age: 0.09 },
    // Puntos de LCD por delante del morro. Va una sola y va lejos, y las dos
    // cosas por el mismo motivo: la estela de la bala mide lo que la bala haya
    // volado mientras el fantasma no se apaga (unos 25 puntos a este zoom). Mas
    // cerca del morro la estela toca la nave y las dos se leen como una lanza;
    // dos balas seguidas se pegan entre si y se leen como un laser, que este
    // juego no tiene. A 45 puntos la raya sale suelta, que es lo que es.
    bullets: [45],
    pickup:  { x: 58, y: 90 },
  },
};

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

// El bucle del juego se para antes de tocar nada: si siguiera corriendo,
// borraria la escena de la portada en el cuadro siguiente.
await page.evaluate(() => { Sfx.quiet = true; window.requestAnimationFrame = () => 0; });
await page.waitForTimeout(150);

const shot = await page.evaluate((C) => {
  /* ---------- azar y reloj quietos: la portada sale igual todas las veces ---------- */
  let s0 = C.seed >>> 0;
  Math.random = () => {                     // mulberry32
    s0 = (s0 + 0x6D2B79F5) >>> 0;
    let t = s0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  performance.now = () => 8000;             // el titileo del cielo, congelado

  /* ---------- la pantalla, con el punto entero ---------- */
  PIX = C.pixel;
  H = C.rows / C.pixel;
  W = C.cols / C.pixel;
  for (const c of [scene, trail]) { c.width = C.cols; c.height = C.rows; }
  ctx.imageSmoothingEnabled = false;
  tctx.setTransform(1, 0, 0, 1, 0, 0);
  VRAM.resize(C.cols, C.rows);
  VRAM.clear();
  Stars.reset(C.cols, C.rows);
  cv.width = C.cols * C.cell; cv.height = C.rows * C.cell;
  cv.style.width = cv.width + 'px'; cv.style.height = cv.height + 'px';
  LCD.setTint([1, 1, 1]);                   // MONO, igual que el icono: el tinte es un secreto del juego
  LCD.resize();

  /* ---------- la escena, en unidades de mundo ---------- */
  const u = (v) => v / C.pixel;             // punto de LCD -> unidad de mundo
  const S = C.scene;

  G.meteors = []; G.bullets = []; G.shards = []; G.rings = []; G.pickups = [];
  G.entry = false; G.ready = 0; G.attract = false; G.flash = 0;

  const ship = newShip(u(S.ship.x), u(S.ship.y), S.ship.a);
  ship.vx = Math.cos(S.ship.a) * S.ship.speed;
  ship.vy = Math.sin(S.ship.a) * S.ship.speed;
  ship.right = !!S.ship.right;              // un motor encendido: la nave esta girando
  G.ship = ship;

  for (const r of S.rocks) {
    G.meteors.push({
      x: u(r.x), y: u(r.y), vx: Math.cos(r.dir) * r.spd, vy: Math.sin(r.dir) * r.spd,
      a: Math.random() * TAU, va: rnd(-CFG.meteorRotMax, CFG.meteorRotMax),
      pts: makeRock(u(r.r)), r: u(r.r), splits: 0,
    });
  }

  // La bala es la del juego: nace en el morro, hereda la velocidad de la nave y
  // se va encogiendo con la vida. Se ponen a distintas alturas del vuelo, que es
  // como se ve una rafaga de verdad: la cadencia es fija y la primera va lejos.
  const nose = CFG.shipLen * 0.5;
  const bs = CFG.bulletSpeed;
  for (let i = 0; i < S.bullets.length; i++) {
    const d = u(S.bullets[i]);
    const vx = Math.cos(ship.a) * bs + ship.vx, vy = Math.sin(ship.a) * bs + ship.vy;
    G.bullets.push({
      x: ship.x + Math.cos(ship.a) * (nose + d), y: ship.y + Math.sin(ship.a) * (nose + d),
      vx, vy, a: ship.a, av: CFG.bulletSpinMin,
      len: Math.hypot(vx, vy) * CFG.bulletStreak,
      life: CFG.bulletLife * (1 - i * 0.22), max: CFG.bulletLife,
    });
  }

  // Roca reventada: los segmentos salen de la roca misma, no de un efecto aparte.
  const b = S.burst;
  disintegrate({ x: u(b.x), y: u(b.y), a: 0.6, vx: 0, vy: 0, pts: makeRock(u(b.r)), r: u(b.r) }, false);
  // Recien reventada, la roca todavia ES la roca: los segmentos estan donde
  // estaban sus lados. Se le adelanta el reloj para que se vea abierta y el
  // polvo apagandose, que es como se ve un impacto y no una piedra mas.
  for (const d of G.shards) { d.x += d.vx * b.age; d.y += d.vy * b.age; d.a += d.va * b.age; d.life -= b.age; }
  // El anillo del impacto se queda fuera. En el juego dura 0.28 s y crece a 130
  // por segundo, o sea que en los pocos cuadros que se graban aca ya se abre
  // media portada, y con la estela detras deja una banda gris de cinco puntos
  // de grosor: a este zoom no se lee como un golpe, se lee como una luna.

  G.pickups.push({ x: u(S.pickup.x), y: u(S.pickup.y), vx: 0, vy: 0,
                   t: 1.35, r: 13 * CFG.pickupScale, kind: 'shield' });

  /* ---------- unos cuadros de vuelo: la estela es la mitad del LCD ---------- */
  // Sin esto la escena queda congelada y sin fantasmas, que es justo lo que
  // distingue a esta pantalla de un dibujo. Se rebobina lo que se va a andar,
  // asi cada pieza termina exactamente donde la puso el reparto de arriba.
  //
  // El paso es mas corto que un cuadro del juego a proposito: la estela se
  // apaga por TIEMPO, asi que a este zoom un cuadro entero de 60 Hz mueve las
  // piezas el doble de lo que se ve en la pantalla real y los fantasmas se
  // despegan. Con 1/150 el rastro vuelve a quedar pegado a lo que lo deja.
  const DT = 1 / 150, STEPS = 8;
  const step = (dt) => {
    for (const m of G.meteors) { m.x += m.vx * dt; m.y += m.vy * dt; m.a += m.va * dt; }
    for (const bl of G.bullets) { bl.x += bl.vx * dt; bl.y += bl.vy * dt; bl.a += bl.av * dt; bl.life -= dt; }
    for (const d of G.shards) { d.x += d.vx * dt; d.y += d.vy * dt; d.a += d.va * dt; d.life -= dt; }
    for (const p of G.pickups) { p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt; }
    G.ship.x += G.ship.vx * dt; G.ship.y += G.ship.vy * dt;
  };
  for (let i = 0; i < STEPS; i++) step(-DT);
  for (let i = 0; i < STEPS; i++) { step(DT); renderWorld(DT); }

  /* ---------- el mismo volcado que hace frame() ---------- */
  ctx.setTransform(PIX, 0, 0, PIX, 0, 0);
  ctx.fillStyle = CFG.bg;
  ctx.fillRect(0, 0, W, H);
  Stars.draw();                             // ultimo: VRAM mezcla por maximo, no tapa nada
  VRAM.blit(1, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(trail, 0, 0);

  /* ---------- el nombre, con la fuente del juego ---------- */
  uiBegin();
  const cx = C.cols / 2;
  for (const [line, y] of C.title) text(line, cx, y, 2, 'center', 3);
  const tw = Font.width(C.title[0][0], 2);
  ctx.fillStyle = TONE[2];                  // la raya del menu, gris claro
  ctx.fillRect(Math.round(cx - tw / 2), C.rule, tw, 1);
  text(C.tag[0], cx, C.tag[1], 1, 'center', 2);
  uiEnd();

  LCD.present();
  return { cols: scene.width, rows: scene.height, cw: cv.width, ch: cv.height, gl: LCD.ok };
}, COVER);

if (!shot.gl) { console.error('sin WebGL no hay paleta ni reticula: la portada saldria cruda'); process.exit(1); }
if (shot.cols !== COVER.cols || shot.rows !== COVER.rows) {
  console.error(`la rejilla salio ${shot.cols}x${shot.rows} y no ${COVER.cols}x${COVER.rows}`);
  process.exit(1);
}

await mkdir(OUT, { recursive: true });
await page.screenshot({ path: join(OUT, 'cover.png') });
console.log(`  cover.png   ${shot.cw}x${shot.ch}  (${shot.cols}x${shot.rows} puntos de ${COVER.cell} px)`);

await browser.close();
server.close();
console.log('\nlisto\n');
