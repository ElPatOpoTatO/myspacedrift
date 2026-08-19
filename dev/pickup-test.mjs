/* Los cinco recolectables, sus versiones infectadas y las tres reglas que los
 * gobiernan: armado diferido, freno por saturacion y burbuja de un golpe.
 *
 * Lo que motiva este archivo: pasar de dos pickups a cinco por dos variantes son
 * diez combinaciones, y ninguna se puede provocar a mano en una partida real sin
 * quedarse media hora esperando el sorteo.
 *
 *   node dev/pickup-test.mjs
 */
import { serve, playwright, KNOWN_NOISE } from './harness.mjs';

const { chromium } = playwright();
const { server, base } = await serve();
const browser = await chromium.launch();
const page = await (await browser.newContext({
  viewport: { width: 768, height: 576 }, hasTouch: true,
})).newPage();
page.on('pageerror', e => { if (!KNOWN_NOISE(e)) console.error('error de pagina:', String(e)); });
await page.goto(`${base}/index.html`, { waitUntil: 'load' });
await page.waitForTimeout(400);

let fail = 0;
const check = (name, ok, extra = '') => {
  if (!ok) fail++;
  console.log(`  ${ok ? 'ok  ' : 'FALLA'} ${name}${extra ? '   ' + extra : ''}`);
};

// Partida quieta y con la nave ya entregada: sin esto manda el autopiloto.
const arm = () => page.evaluate(() => {
  Sfx.quiet = true;
  startGame('play');
  G.entry = false; G.entryT = 0; G.ready = 0;
  G.meteors.length = 0; G.pickups.length = 0; G.bullets.length = 0;
  const s = G.ship;
  s.x = 200; s.y = 120; s.vx = 0; s.vy = 0; s.alive = true;
  s.invuln = 0; s.invulnBad = false; s.grace = 0; s.fx = {};
  s.lives = CFG.lives; s.damaged = false;
});

// Deja un pickup ya armado encima de la nave y corre un cuadro: lo recoge.
const give = (kind, bad) => page.evaluate(([kind, bad]) => {
  const s = G.ship;
  G.pickups.push({ x: s.x, y: s.y, vx: 0, vy: 0, t: 0, r: 13 * CFG.pickupScale,
                   kind, bad, armed: true, away: 9 });
  updatePlay(1 / 60);
  return { fx: Object.keys(s.fx), invuln: s.invuln, bad: s.invulnBad,
           lives: s.lives, left: G.pickups.length };
}, [kind, bad]);

console.log('\nlos cinco, limpios');
for (const kind of ['spread', 'pierce', 'anchor']) {
  await arm();
  const r = await give(kind, false);
  check(`${kind} se aplica`, r.fx.includes(kind) && r.left === 0, r.fx.join(','));
}
{
  await arm();
  const r = await give('shield', false);
  check('shield pone la burbuja sana', r.invuln > 0 && !r.bad, `invuln ${r.invuln.toFixed(2)}`);
}
{
  await page.evaluate(() => { G.ship.lives = 1; G.ship.damaged = true; });
  const r = await give('repair', false);
  const tope = await page.evaluate(() => CFG.lives);
  check('repair devuelve la vida', r.lives === tope, `vidas ${r.lives} de ${tope}`);
}

console.log('\nlos cinco, infectados');
for (const kind of ['spread', 'pierce', 'anchor']) {
  await arm();
  const r = await page.evaluate(k => {
    const s = G.ship;
    G.pickups.push({ x: s.x, y: s.y, vx: 0, vy: 0, t: 0, r: 8, kind: k, bad: true, armed: true, away: 9 });
    updatePlay(1 / 60);
    return { t: s.fx[k] && s.fx[k].t, bad: s.fx[k] && s.fx[k].bad };
  }, kind);
  const esperado = 8.0 * 0.70;
  check(`${kind} infectado dura el 70%`, r.bad === true && Math.abs(r.t - esperado) < 0.05,
        `${r.t && r.t.toFixed(2)} vs ${esperado.toFixed(2)}`);
}
{
  await arm();
  const r = await give('shield', true);
  check('shield infectado no protege y cruza los mandos',
        r.invuln > 0 && r.bad === true, `invuln ${r.invuln.toFixed(2)}`);
  const cross = await page.evaluate(() => inverted(G.ship));
  check('inverted() lo ve', cross === true);
}
{
  await arm();
  await page.evaluate(() => { G.ship.lives = 1; G.ship.damaged = true; });
  const r = await page.evaluate(() => {
    const s = G.ship;
    G.pickups.push({ x: s.x, y: s.y, vx: 0, vy: 0, t: 0, r: 8, kind: 'repair', bad: true, armed: true, away: 9 });
    updatePlay(1 / 60);
    return { lives: s.lives, invert: !!s.fx.invert };
  });
  check('repair infectado no cura y cruza los mandos', r.lives === 1 && r.invert, `vidas ${r.lives}`);
}

console.log('\narmado diferido');
{
  await arm();
  const r = await page.evaluate(() => {
    const s = G.ship;
    // nace justo encima, como cuando revientas una roca a bocajarro
    G.pickups.push({ x: s.x, y: s.y, vx: 0, vy: 0, t: 0, r: 13 * CFG.pickupScale,
                     kind: 'shield', bad: false, armed: false, away: 0 });
    for (let i = 0; i < 60; i++) { s.vx = 0; s.vy = 0; s.x = 200; s.y = 120; updatePlay(1 / 60); }
    return { quedan: G.pickups.length, invuln: s.invuln, armed: G.pickups[0] && G.pickups[0].armed };
  });
  check('encima de la nave no se agarra', r.quedan === 1 && r.invuln === 0, `armado ${r.armed}`);
  const r2 = await page.evaluate(() => {
    const s = G.ship, p = G.pickups[0];
    p.x = s.x + 90;                                  // la nave se aleja
    for (let i = 0; i < 40; i++) { s.vx = 0; s.vy = 0; s.x = 200; s.y = 120; updatePlay(1 / 60); }
    const armed = p.armed;
    p.x = s.x; p.y = s.y;                            // y vuelve
    updatePlay(1 / 60);
    return { armed, quedan: G.pickups.length, invuln: s.invuln };
  });
  check('medio segundo afuera lo arma', r2.armed === true);
  check('y entonces si se agarra', r2.quedan === 0 && r2.invuln > 0);
}

console.log('\nfreno por saturacion');
{
  const odds = await page.evaluate(() => {
    const s = G.ship, out = {};
    const media = () => ({ r: (curve().sizeMin + curve().sizeMax) / 2, splits: 0 });
    const medir = () => dropOdds(media());
    s.fx = {}; s.invuln = 0; G.pickups.length = 0;   out.cero = medir();
    s.fx = { spread: { t: 5, max: 8, bad: false } };  out.uno  = medir();
    s.fx.pierce = { t: 5, max: 8, bad: false };       out.dos  = medir();
    s.fx.anchor = { t: 5, max: 8, bad: false };       out.tres = medir();
    s.fx = {}; G.pickups.push({}, {});                out.volando2 = medir();
    G.pickups.push({});                               out.volando3 = medir();
    G.pickups.length = 0;
    return out;
  });
  check('con cero y con uno cae igual', Math.abs(odds.cero - odds.uno) < 1e-9, odds.cero.toFixed(4));
  check('con dos cae la mitad', Math.abs(odds.dos - odds.uno / 2) < 1e-9, odds.dos.toFixed(4));
  check('con tres no cae nada', odds.tres === 0);
  check('los que vuelan cuentan igual', Math.abs(odds.volando2 - odds.dos) < 1e-9 && odds.volando3 === 0);
}
{
  // las mitades de una roca partida pagan mas que una roca entera del mismo tamano
  const r = await page.evaluate(() => {
    G.ship.fx = {}; G.ship.invuln = 0; G.pickups.length = 0;
    const rad = (curve().sizeMin + curve().sizeMax) / 2;
    return { entera: dropOdds({ r: rad, splits: 0 }),
             mitad:  dropOdds({ r: rad, splits: 1 }),
             cuarto: dropOdds({ r: rad, splits: 2 }) };
  });
  check('la mitad de una roca partida paga +20%',
        Math.abs(r.mitad - r.entera * 1.2) < 1e-9, `${r.entera.toFixed(4)} -> ${r.mitad.toFixed(4)}`);
  check('y el extra no se compone con cada corte',
        Math.abs(r.cuarto - r.mitad) < 1e-9, r.cuarto.toFixed(4));
}

console.log('\nla burbuja');
{
  await arm();
  const r = await page.evaluate(() => {
    const s = G.ship;
    s.invuln = CFG.invulnTime; s.invulnBad = false; s.grace = 0;
    spawnMeteor();
    const m = G.meteors[G.meteors.length - 1];
    m.x = s.x; m.y = s.y; m.vx = 0; m.vy = 0; m.mia = true;
    const antes = { vidas: s.lives };
    updatePlay(1 / 60);
    return { antes, vidas: s.lives, invuln: s.invuln, grace: s.grace,
             mias: G.meteors.filter(x => x.mia).length };
  });
  check('come el golpe sin costar una vida', r.vidas === r.antes.vidas, `vidas ${r.vidas}`);
  check('y revienta', r.invuln === 0, `invuln ${r.invuln}`);
  check('se lleva la roca', r.mias === 0, `quedan ${r.mias} de 1`);
  check('y deja gracia para salir', r.grace > 0, `grace ${r.grace.toFixed(2)}`);
}
{
  await arm();
  const r = await page.evaluate(() => {
    const s = G.ship;
    s.invuln = CFG.invulnTime; s.invulnBad = true; s.grace = 0;   // infectada
    spawnMeteor();
    const m = G.meteors[G.meteors.length - 1];
    m.x = s.x; m.y = s.y; m.vx = 0; m.vy = 0;
    const antes = s.lives;
    updatePlay(1 / 60);
    return { antes, vidas: s.lives };
  });
  check('la burbuja infectada NO protege', r.vidas === r.antes - 1, `vidas ${r.vidas}`);
}
{
  // a caballo del borde envolvente la absorcion tiene que pasar una sola vez
  await arm();
  const vidasTope = await page.evaluate(() => CFG.lives);
  const r = await page.evaluate(() => {
    const s = G.ship;
    s.x = 2; s.y = 60;                       // pegada al borde: shipCopies da dos
    s.invuln = CFG.invulnTime; s.invulnBad = false; s.grace = 0;
    for (let k = 0; k < 2; k++) {
      spawnMeteor();
      const m = G.meteors[G.meteors.length - 1];
      m.y = s.y; m.vx = 0; m.vy = 0;
      m.x = k === 0 ? s.x : s.x + W;         // una a cada lado de la costura
      m.mia = true;
    }
    updatePlay(1 / 60);
    return { mias: G.meteors.filter(x => x.mia).length, vidas: s.lives };
  });
  check('absorbe una sola vez en la costura', r.mias === 1 && r.vidas === vidasTope,
        `quedan ${r.mias} de 2, vidas ${r.vidas}`);
}

console.log('\nla perforante');
{
  await arm();
  const r = await page.evaluate(() => {
    const s = G.ship;
    s.fx.pierce = { t: 8, max: 8, bad: false };
    G.bullets.push({ x: 100, y: 120, vx: 300, vy: 0, a: 0, av: 0, len: 6,
                     life: 5, max: 5, pierce: true, cool: 0 });
    // marcadas, porque el spawner sigue metiendo rocas mientras corren los cuadros
    for (let k = 0; k < 3; k++) {
      spawnMeteor();
      const m = G.meteors[G.meteors.length - 1];
      m.x = 130 + k * 45; m.y = 120; m.vx = 0; m.vy = 0; m.mia = true;
    }
    for (let i = 0; i < 60; i++) updatePlay(1 / 60);
    return { vivas: G.meteors.filter(m => m.mia).length, balas: G.bullets.length };
  });
  check('una bala se lleva mas de una roca', 3 - r.vivas >= 2, `quedan ${r.vivas} de 3`);
}
{
  // sin perforar, la misma bala solo puede llevarse una
  await arm();
  const r = await page.evaluate(() => {
    G.bullets.push({ x: 100, y: 120, vx: 300, vy: 0, a: 0, av: 0, len: 6,
                     life: 5, max: 5, pierce: false, cool: 0 });
    for (let k = 0; k < 3; k++) {
      spawnMeteor();
      const m = G.meteors[G.meteors.length - 1];
      m.x = 130 + k * 45; m.y = 120; m.vx = 0; m.vy = 0; m.mia = true;
    }
    for (let i = 0; i < 60; i++) updatePlay(1 / 60);
    return { vivas: G.meteors.filter(m => m.mia).length };
  });
  check('la bala normal se lleva una sola', 3 - r.vivas <= 1, `quedan ${r.vivas} de 3`);
}

// El eje que sostiene toda la lectura de la infeccion: lo infectado esta quieto y
// lo limpio no. Se mide grabando la geometria que cada figura manda al VRAM en dos
// instantes distintos. Si alguna figura limpia dibujara lo mismo en los dos, la
// quietud dejaria de significar "infectado" y el sistema entero se cae.
console.log('\nquieto = infectado');
{
  const r = await page.evaluate(() => {
    const trazo = (kind, bad, t) => {
      const log = [];
      const orig = {};
      for (const m of ['line', 'point', 'circle', 'polyAt', 'plot']) {
        orig[m] = VRAM[m];
        VRAM[m] = (...a) => log.push(m + ':' + a.map(v =>
          typeof v === 'number' ? v.toFixed(3) : JSON.stringify(v)).join(','));
      }
      drawPickup({ x: 100, y: 100, t, r: 13 * CFG.pickupScale, kind, bad });
      for (const m in orig) VRAM[m] = orig[m];
      return log.join('|');
    };
    const out = {};
    for (const k of Object.keys(PICKUPS)) {
      out[k] = { limpio: trazo(k, false, 0.31) !== trazo(k, false, 1.93),
                 infectado: trazo(k, true, 0.31) === trazo(k, true, 1.93) };
    }
    return out;
  });
  for (const k of Object.keys(r)) {
    check(`${k} limpio se mueve`, r[k].limpio);
    check(`${k} infectado esta congelado`, r[k].infectado);
  }
}

console.log('\nel barrido de seguridad');
{
  await arm();
  const r = await page.evaluate(() => {
    const s = G.ship;
    s.fx = { spread: { t: 8, max: 8, bad: false }, pierce: { t: 7, max: 8, bad: false },
             anchor: { t: 6, max: 8, bad: false }, invert: { t: 2, max: 8, bad: true } };
    G.fxSweep = 0.001;
    updatePlay(1 / 60);
    return Object.keys(s.fx);
  });
  check('recorta a tres y se cae el que menos le queda',
        r.length === 3 && !r.includes('invert'), r.join(','));
}

await browser.close();
server.close();
console.log(fail ? `\n${fail} fallas\n` : '\ntodo bien\n');
process.exit(fail ? 1 : 0);
