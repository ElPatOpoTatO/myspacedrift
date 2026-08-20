/* Comprueba la geometria de colision: que cada cosa choque con la forma que se
 * ve, y que choque igual en cualquier pantalla.
 *
 * Los dos fallos que motivan este archivo:
 *
 *   - La bala se probaba como UN PUNTO aunque se dibuja como una raya de hasta
 *     diez unidades que tumbea. Un tiro que visualmente atravesaba la roca no le
 *     hacia nada.
 *   - La nave chocaba con un circulo de radio 11 contra un casco de 27 x 20,25.
 *     El morro llega a 13,5 y el flanco a 4,74, asi que moria por rocas que le
 *     pasaban al costado y sobrevivia roces de punta.
 *
 * Y el requisito que los ata a los dos: el hitbox se mide en unidades de mundo,
 * nunca en puntos de LCD ni de pantalla. Por eso la ultima tanda corre los mismos
 * casos en dos ventanas de forma bien distinta y exige el mismo veredicto: el
 * lienzo se encoge al mayor 16:9 que entre, asi que una unidad de mundo mide
 * distinta cantidad de px CSS en cada una, y la colision no puede enterarse.
 *
 * No juega ninguna partida: arma las poses a mano y llama a las funciones de
 * geometria directo, asi que no depende del azar ni del reloj.
 *
 *   node dev/collide-test.mjs
 */
import { serve, playwright, reporter, KNOWN_NOISE } from './harness.mjs';

const { chromium } = playwright();
const { server, base } = await serve();
const [res, check] = reporter();

const browser = await chromium.launch();

// Los casos viven dentro de la pagina porque llaman a la geometria del juego.
// Devuelven [nombre, obtenido, esperado] para poder compararlos entre pantallas.
function cases() {
  // Roca de prueba: un octogono regular de circunradio r, que es lo que 'm.r'
  // promete. Las de verdad son azarosas; estas tienen que ser repetibles.
  const rock = (x, y, r, a = 0) => ({
    x, y, a, r, splits: 0,
    pts: Array.from({ length: 8 }, (_, i) => {
      const t = i / 8 * Math.PI * 2;
      return { x: Math.cos(t) * r, y: Math.sin(t) * r };
    }),
  });
  // Bala con la vida al maximo salvo que se pida otra cosa.
  const bullet = (x, y, a, len, life = CFG.bulletLife) =>
    ({ x, y, a, len, life, max: CFG.bulletLife });
  // El disparo tal como lo resuelve updatePlay: la raya entera contra la roca.
  const shoots = (b, m) => {
    const half = bulletHalf(b);
    const hx = Math.cos(b.a) * half, hy = Math.sin(b.a) * half;
    if (Math.hypot(b.x - m.x, b.y - m.y) > m.r + half) return false;
    return segHitsRock(b.x - hx, b.y - hy, b.x + hx, b.y + hy, m);
  };
  const crashes = (x, y, a, m) =>
    polyHitsRock(hullAt(HULL_DMG, x, y, a, HULL_WORLD), m);
  const grabs = (x, y, a, px, py, pr) =>
    polyHitsCircle(hullAt(HULL_GRAB, x, y, a, HULL_WORLD), px, py, pr * PICKUP_BREATHE_MAX);

  const out = [];
  const t = (name, got, want) => out.push([name, got, want]);

  /* ---- la bala es la raya, no su centro ---------------------------------- */

  // El caso que motiva todo: la roca queda cerca de una punta de la raya, asi
  // que el centro de la bala esta afuera y las dos puntas tambien. Con el test
  // de punto esto no acertaba nunca.
  t('raya atraviesa la roca con las dos puntas afuera',
    shoots(bullet(0, 0, 0, 24), rock(-8, 0, 3)), true);

  t('una punta de la raya adentro de la roca',
    shoots(bullet(8, 0, Math.PI, 10), rock(0, 0, 5)), true);

  t('el centro de la bala adentro de la roca',
    shoots(bullet(0, 0, 0, 10), rock(0, 0, 5)), true);

  t('bala lejos, sin contacto',
    shoots(bullet(30, 0, 0, 10), rock(0, 0, 5)), false);

  // El largo se encoge con el apagado, asi que la misma bala en el mismo sitio
  // acierta recien salida y ya no llega cuando se esta yendo.
  t('bala nueva: la raya llega',
    shoots(bullet(0, 0, 0, 24, CFG.bulletLife), rock(-8, 0, 3)), true);
  t('bala apagandose: la raya ya no llega',
    shoots(bullet(0, 0, 0, 24, 0.001), rock(-8, 0, 3)), false);

  // El largo de colision tiene que ser el mismo que el del dibujo: una sola
  // fuente, o tarde o temprano la bala pega donde no se ve.
  const fresh = bullet(0, 0, 0, 24);
  t('la raya recien salida mide el largo entero', bulletHalf(fresh) * 2, fresh.len);
  t('la raya se acorta al apagarse',
    bulletHalf(bullet(0, 0, 0, 24, CFG.bulletLife * 0.2)) < bulletHalf(fresh), true);

  /* ---- la nave choca con su contorno ------------------------------------- */

  // Perpendicular al borde derecho del casco: por ahi el contorno solo llega a
  // 4,74 del centro (4,17 ya encogido), no a los 11 del circulo viejo.
  const NX = 0.35107, NY = 0.93635;            // normal del flanco, normalizada
  t('roca rozando el flanco a 6u: NO mata (el circulo si mataba)',
    crashes(0, 0, 0, rock(6 * NX, 6 * NY, 0.5)), false);
  t('roca sobre el flanco a 4u: mata',
    crashes(0, 0, 0, rock(4 * NX, 4 * NY, 0.5)), true);

  // El morro llega mas lejos que el circulo: 11,88 contra 11.
  t('roca en el morro a 13u: mata (el circulo no llegaba)',
    crashes(0, 0, 0, rock(13, 0, 1.5)), true);

  // Contencion, en los dos sentidos.
  t('roca chica metida entera adentro del casco',
    crashes(0, 0, 0, rock(0, 0, 1)), true);
  t('casco metido entero adentro de una roca grande',
    crashes(0, 0, 0, rock(0, 0, 50)), true);

  t('roca lejos: no mata', crashes(0, 0, 0, rock(60, 60, 5)), false);

  // Girar la nave gira el hitbox: la misma roca que estaba en el morro pasa a
  // quedar detras cuando la nave da media vuelta.
  t('la misma roca del morro, con la nave al reves: no mata',
    crashes(0, 0, Math.PI, rock(13, 0, 1.5)), false);

  /* ---- el hitbox calza con el dibujo ------------------------------------- */

  // hullAt tiene que usar la misma convencion de giro que el dibujo (drawShip y
  // VRAM.polyAt). Si se le invierte un signo el juego se ve igual pero mata mal,
  // y no hay forma de notarlo a ojo.
  {
    const a = 0.7, ca = Math.cos(a), sa = Math.sin(a), X = 30, Y = 40;
    const h = hullAt(SHIP_PTS, X, Y, a, HULL_WORLD);
    let peor = 0;
    SHIP_PTS.forEach((p, i) => {                       // la formula tal cual la escribe drawShip
      peor = Math.max(peor, Math.hypot(h[i].x - (X + p.x * ca - p.y * sa),
                                       h[i].y - (Y + p.x * sa + p.y * ca)));
    });
    t('hullAt gira igual que el dibujo', peor < 1e-9, true);
  }

  // El casco de dano va adentro del de agarre, y el de agarre es el sprite.
  t('el hitbox de dano queda adentro del contorno dibujado', HULL_R_DMG < HULL_R_GRAB, true);
  t('el hitbox de agarre ES el contorno dibujado',
    HULL_GRAB.length === SHIP_PTS.length &&
    HULL_GRAB.every((p, i) => p.x === SHIP_PTS[i].x && p.y === SHIP_PTS[i].y), true);

  /* ---- la nave partida por el borde ------------------------------------- */

  // Solo la nave se envuelve, y las copias tambien chocan: si no, cruzar el
  // borde seria un rato de invulnerabilidad gratis.
  {
    const wrapped = G.entry;
    G.entry = false;
    const s = { x: 2, y: H / 2 };
    const copias = shipCopies(s).length;
    const m = rock(W - 2, H / 2, 6);
    let pega = false;
    for (const cpy of shipCopies(s)) {
      if (polyHitsRock(hullAt(HULL_DMG, cpy.x, cpy.y, 0, HULL_WORLD), m)) pega = true;
    }
    G.entry = wrapped;
    t('la nave pegada al borde se parte en dos copias', copias, 2);
    t('la copia del otro borde tambien choca', pega, true);
  }

  /* ---- recolectables ----------------------------------------------------- */

  const PR = 13 * CFG.pickupScale;
  t('recolectable a 12u del flanco: se agarra', grabs(0, 0, 0, 12 * NX, 12 * NY, PR), true);
  t('recolectable a 22u del flanco: no se agarra', grabs(0, 0, 0, 22 * NX, 22 * NY, PR), false);
  t('recolectable pegado al morro: se agarra', grabs(0, 0, 0, 20, 0, PR), true);

  // El radio de agarre es el del pico del latido, fijo: agarrar no puede
  // depender de en que parte de la respiracion cayo el frame.
  {
    const alcance = 4.74 + PR * PICKUP_BREATHE_MAX;    // flanco + radio del pico
    t('justo adentro del alcance', grabs(0, 0, 0, (alcance - 0.2) * NX, (alcance - 0.2) * NY, PR), true);
    t('justo afuera del alcance', grabs(0, 0, 0, (alcance + 0.2) * NX, (alcance + 0.2) * NY, PR), false);
    t('el agarre usa el pico del latido, no el valor de reposo', PICKUP_BREATHE_MAX > 1, true);
  }

  // Agarrar perdona mas que morir, a proposito: es el unico par donde encoger
  // el hitbox le juega en contra al jugador.
  t('el alcance de agarre supera al de dano', HULL_R_GRAB > HULL_R_DMG, true);

  return out;
}

/* ------------------------------------------------------------------------- */

// Dos ventanas de forma bien distinta: la cuadrada deja barras arriba y abajo, la
// panoramica a los costados. La reticula es la misma en las dos (192x108, que para
// eso esta bloqueado el aspecto), pero el lienzo mide muy distinto en px, y el
// veredicto no tiene que moverse ni un caso.
const VIEWPORTS = [
  ['cuadrada 800x600',   800,  600],
  ['panoramica 2560x1080', 2560, 1080],
];

const runs = [];
for (const [name, width, height] of VIEWPORTS) {
  const page = await (await browser.newContext({ viewport: { width, height } })).newPage();
  const errors = [];
  page.on('pageerror', e => { if (!KNOWN_NOISE(e)) errors.push(String(e)); });
  await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const info = await page.evaluate(() => ({ pix: PIX, sc: SC, w: W, h: H }));
  const rows = await page.evaluate(`(${cases.toString()})()`);
  runs.push({ name, rows, errors, ...info });
  await page.close();
}

const [primera, segunda] = runs;

console.log(`\ngeometria de colision   (${primera.name}, PIX ${primera.pix.toFixed(3)})`);
for (const [name, got, want] of primera.rows) {
  check(name, JSON.stringify(got) === JSON.stringify(want),
        JSON.stringify(got) === JSON.stringify(want) ? '' : `dio ${JSON.stringify(got)}, esperaba ${JSON.stringify(want)}`);
}

console.log('\nel tamano de las cosas no depende de la pantalla');
check(`el mundo mide igual: ${primera.w.toFixed(1)}x${primera.h} y ${segunda.w.toFixed(1)}x${segunda.h}`,
      primera.w === segunda.w && primera.h === segunda.h);
check(`y la reticula tambien: PIX ${primera.pix.toFixed(3)} en las dos`,
      Math.abs(primera.pix - segunda.pix) < 1e-9);
// Lo que SI cambia es cuantos px CSS mide una unidad de mundo, porque el lienzo
// se encoge al 16:9 que entre. Si algun dia la colision se colara al espacio de
// pantalla, se colaria por aca.
check(`lo que cambia es la escala en pantalla: ${primera.sc.toFixed(3)} contra ${segunda.sc.toFixed(3)}`,
      Math.abs(primera.sc - segunda.sc) > 1e-6);
for (let i = 0; i < primera.rows.length; i++) {
  const [name, a] = primera.rows[i];
  const b = segunda.rows[i][1];
  check(`mismo veredicto: ${name}`, JSON.stringify(a) === JSON.stringify(b),
        JSON.stringify(a) === JSON.stringify(b) ? '' : `${JSON.stringify(a)} contra ${JSON.stringify(b)}`);
}

console.log('\nsin errores de pagina');
for (const r of runs) check(r.name, r.errors.length === 0, r.errors[0] || '');

await browser.close();
server.close();
console.log(res.failed ? `\n${res.failed} fallo/s` : '\ntodo correcto');
process.exit(res.failed ? 1 : 0);
