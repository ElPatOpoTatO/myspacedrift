/* Comprueba el modo demo: el del menu y el que se elige.
 *
 * Lo que motiva este archivo: la demo es lo unico del juego que se mira sin tocar,
 * asi que si se rompe nadie se entera hasta que un desconocido abre el juego y ve
 * una pantalla quieta. Y son dos, con reglas opuestas: la de fondo tiene que ser
 * callada y apagada para no competir con el menu, y la elegida tiene que sonar,
 * ocupar la pantalla y explicar. Confundirlas es el fallo probable.
 *
 *   node dev/demo-test.mjs
 */
import { serve, playwright, reporter, KNOWN_NOISE } from './harness.mjs';

const { chromium } = playwright();
const { server, base } = await serve();
const browser = await chromium.launch();
const page = await (await browser.newContext({
  viewport: { width: 800, height: 400 }, hasTouch: true,
})).newPage();
const errors = [];
page.on('pageerror', e => { if (!KNOWN_NOISE(e)) errors.push(String(e)); });
await page.goto(`${base}/index.html`, { waitUntil: 'load' });
await page.waitForTimeout(400);

const [res, check] = reporter();
const q = fn => page.evaluate(fn);

console.log('\nel menu');
{
  const rows = await q(() => Menu.rows.slice());
  check('tres filas', rows.length === 3, JSON.stringify(rows));
  check('DEMO va entre PLAY y HIGH SCORES',
        rows[0] === 'PLAY' && rows[1] === 'DEMO' && rows[2] === 'HIGH SCORES', JSON.stringify(rows));

  // La tercera fila estira el cuadro y el codigo de emparejamiento tiene que
  // haberse corrido. El reparto ya no son constantes: con el tope de columnas la
  // pantalla puede quedar en 104 filas y el menu se reacomoda (§21.2), asi que
  // se lee el reparto que publica el dibujo en vez de recalcular las posiciones.
  const g = await q(() => ({ lh: LH(), gh: Font.GH, ...Menu.layout }));
  const boxBottom = g.boxTop + g.boxH;
  check('el cuadro no pisa el codigo', boxBottom <= g.codeY,
        `cuadro hasta ${boxBottom}, codigo en ${g.codeY}`);
  check('la ayuda de navegacion tampoco', !g.help || boxBottom + 4 + g.gh <= g.codeY,
        g.help ? `ayuda hasta ${boxBottom + 4 + g.gh}, codigo en ${g.codeY}` : 'no entraba, no se dibuja');
  check('el codigo entra en el LCD', g.codeY + g.codeH <= g.lh, `${g.codeY + g.codeH} de ${g.lh}`);
  check('y no pisa la franja de controles', g.codeY + g.codeH <= g.hintsY,
        `codigo hasta ${g.codeY + g.codeH}, franja en ${g.hintsY}`);
}

console.log('\nla demo elegida');
{
  await q(() => activate('DEMO'));
  await page.waitForTimeout(500);
  const st = await q(() => ({ screen, attract: G.attract, demo: G.demo, quiet: Sfx.quiet,
                              ship: !!G.ship, card: Demo.card }));
  check('se va a su propia pantalla', st.screen === 'DEMO', st.screen);
  check('vuela la maquina', st.attract === true);
  check('queda marcada como la elegida', st.demo === true);
  check('esta NO esta callada: se eligio para verla y oirla', st.quiet === false);
  check('hay nave en el campo', st.ship === true);
  check('empieza por el primer cartel', st.card[0] === 'THE MACHINE IS FLYING', JSON.stringify(st.card));

  await page.waitForTimeout(5400);
  const run = await q(() => ({ score: G.score, meteors: G.meteors.length, card: Demo.card, alive: G.ship.alive }));
  check('el bot juega de verdad y puntua', run.score > 0, String(Math.floor(run.score)));
  check('el campo tiene rocas', run.meteors > 0, String(run.meteors));
  check('los carteles avanzan solos', run.card[0] !== 'THE MACHINE IS FLYING', JSON.stringify(run.card));
}

console.log('\nla franja de motores');
{
  // La demo ensena porque la etiqueta de abajo se enciende con el motor que la
  // maquina aprieta. Si la nave no publicara su estado, la franja mentiria.
  const s = await q(() => ({ left: typeof G.ship.left, right: typeof G.ship.right }));
  check('la nave publica sus dos motores', s.left === 'boolean' && s.right === 'boolean');
  // Hay que mirar frames de verdad: botControl es una funcion del estado de ESTE
  // instante, asi que llamarla mil veces seguidas devuelve mil veces lo mismo.
  const seen = await q(() => new Promise(done => {
    const acc = { left: false, right: false };
    const t0 = performance.now();
    (function look() {
      if (G.ship) { acc.left = acc.left || G.ship.left; acc.right = acc.right || G.ship.right; }
      if ((acc.left && acc.right) || performance.now() - t0 > 4000) return done(acc);
      requestAnimationFrame(look);
    })();
  }));
  check('el bot enciende los dos motores (hay algo que encender)', seen.left && seen.right,
        JSON.stringify(seen));
}

console.log('\nsalir');
{
  await page.touchscreen.tap(400, 200);
  await page.waitForTimeout(250);
  const st = await q(() => ({ screen, attract: G.attract, demo: G.demo, ship: !!G.ship,
                              chosen: Menu.rows[Menu.sel] }));
  check('un toque devuelve al menu', st.screen === 'MENU', st.screen);
  check('la demo quedo apagada', st.attract === false && st.demo === false);
  check('el campo quedo limpio', st.ship === false);
  check('vuelve con PLAY marcado', st.chosen === 'PLAY', String(st.chosen));
}

console.log('\nel boton de sonido dentro de la demo');
{
  await q(() => { Demo.reset(); activate('DEMO'); });
  await page.waitForTimeout(200);
  const before = await q(() => Sfx.muted);
  const p = await q(() => { const b = muteBox(); return { x: (b.x + b.w / 2) * SC, y: (b.y + b.h / 2) * SC }; });
  await page.touchscreen.tap(p.x, p.y);
  await page.waitForTimeout(200);
  const st = await q(() => ({ screen, muted: Sfx.muted }));
  check('el sonido gana al toque que sale', st.screen === 'DEMO', st.screen);
  check('y mutea', st.muted !== before);
  await q(() => Sfx.toggleMute());
}

console.log('\nla demo de fondo del menu');
{
  await q(() => quitAttract());
  await q(() => { Input.lastTouch = performance.now() - (CFG.attractDelay + 1) * 1000; });
  await page.waitForTimeout(400);
  const st = await q(() => ({ screen, attract: G.attract, demo: G.demo, quiet: Sfx.quiet }));
  check('arranca sola por inactividad', st.screen === 'MENU' && st.attract === true,
        `${st.screen} attract=${st.attract}`);
  check('sigue callada', st.quiet === true);
  check('no se confunde con la elegida', st.demo === false);
  check('sigue detras del menu, sin pantalla propia', st.screen === 'MENU', st.screen);
}

console.log('\ncuando el bot muere');
{
  await q(() => { quitAttract(); Demo.reset(); activate('DEMO'); });
  await page.waitForTimeout(200);
  await q(() => { G.ship.lives = 1; damageShip(); });
  // la muerte corre en camara lenta (timeScale sube de 0.22 a 1), asi que el segundo
  // y medio de G.deathTimer son casi tres de reloj de pared
  await page.waitForTimeout(4000);
  const st = await q(() => ({ screen, demo: G.demo, alive: !!(G.ship && G.ship.alive), pending: !!hs.pending }));
  check('la maquina no entra al top 10', st.pending === false);
  check('se rearma la misma demo', st.screen === 'DEMO' && st.demo === true, st.screen);
  check('con nave nueva', st.alive === true);
}

check('sin errores de pagina', errors.length === 0, errors.join(' | '));

await browser.close();
server.close();
console.log(res.failed ? `\n${res.failed} fallos\n` : '\ntodo bien\n');
process.exit(res.failed ? 1 : 0);
