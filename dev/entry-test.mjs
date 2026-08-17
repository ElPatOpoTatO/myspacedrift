/* Comprueba la entrada de la nave al empezar cada partida.
 *
 * La entrada no es una animacion aparte: es la nave volando con las mismas
 * fisicas del juego, traida por un autopiloto que solo tiene los dos motores
 * del jugador. Por eso hay que comprobarla como se comprueba una partida —
 * simulando frames— y no mirando un fotograma.
 *
 *   node dev/entry-test.mjs
 *
 * Lo que tiene que cumplirse siempre, en cualquier ancho de pantalla:
 *   - nace quieta, fuera del campo y con el morro girado al azar
 *   - llega al centro, despacio y sin quedarse orbitando (el radio y el tope de
 *     tiempo son redes de seguridad, no el camino normal)
 *   - mientras llega el campo esta vacio, y no punta, no dispara ni choca
 *   - no se envuelve por los bordes: estando fuera, envolverla la sacaria por
 *     el borde contrario en vez de dejarla entrar
 *   - no se queda mucho rato invisible: la partida no puede empezar con la
 *     pantalla sin nave
 *   - el relevo se avisa: al llegar, la nave parpadea y sale un anillo
 */
import { serve, playwright, reporter, KNOWN_NOISE } from './harness.mjs';

const RUNS = 300;
const STEP = 1 / 60;

const { chromium } = playwright();
const { server, base } = await serve();
const browser = await chromium.launch();
const [res, check] = reporter();

// Simula RUNS partidas enteras hasta que el mando pasa al jugador. Los motores
// del jugador quedan aporreados a proposito: durante la entrada no deben
// tocar nada, y con los dos puestos (que es el freno, no gira) la nave no
// llegaria al centro si el autopiloto no mandara.
const sample = () => page.evaluate(({ RUNS, STEP }) => {
  const durs = [], scores = [], dists = [], outs = [], darks = [], starts = [], angles = [], vels = [];
  let quieta = true, fuera = true, viva = true, envuelta = 0, balas = 0, rocas = 0;
  const bordes = [];
  for (let n = 0; n < RUNS; n++) {
    startGame('play');
    const s = G.ship;
    if (Math.hypot(s.vx, s.vy) !== 0) quieta = false;
    if (s.x >= 0 && s.x <= W && s.y >= 0 && s.y <= H) fuera = false;
    angles.push(s.a);
    starts.push([Math.round(s.x), Math.round(s.y)].join());
    bordes.push(s.y < 0 ? 'N' : s.x > W ? 'E' : s.y > H ? 'S' : 'O');
    Input.left = n % 2 === 0; Input.right = n % 3 === 0;
    let t = 0, prev = { x: s.x, y: s.y }, sc = 0, out = 0, dark = 0;
    while (G.entry && t < 12) {
      updatePlay(STEP); t += STEP;
      if (!G.entry) break;                       // el frame de la llegada ya es partida
      sc = G.score;
      balas += G.bullets.length; rocas += G.meteors.length;
      if (s.lives < CFG.lives || !s.alive) viva = false;
      if (Math.hypot(s.x - prev.x, s.y - prev.y) > 60) envuelta++;   // un salto solo puede ser la envoltura
      out = Math.max(out, Math.max(-s.x, s.x - W, -s.y, s.y - H, 0));
      const half = CFG.shipLen / 2;
      if (s.x < -half || s.x > W + half || s.y < -half || s.y > H + half) dark += STEP;
      prev = { x: s.x, y: s.y };
    }
    Input.left = Input.right = false;
    durs.push(t); scores.push(sc); outs.push(out); darks.push(dark);
    dists.push(Math.hypot(W / 2 - s.x, H / 2 - s.y));
    vels.push(Math.hypot(s.vx, s.vy));
  }
  durs.sort((a, b) => a - b);
  const max = a => Math.max(...a);
  return {
    W: Math.round(W), H: Math.round(H), quieta, fuera, viva, envuelta, balas, rocas,
    p50: +durs[Math.floor(RUNS / 2)].toFixed(2), max: +durs[RUNS - 1].toFixed(2),
    maxScore: +max(scores).toFixed(3), maxDist: +max(dists).toFixed(1),
    maxOut: +max(outs).toFixed(1), maxDark: +max(darks).toFixed(2),
    maxVel: +max(vels).toFixed(1), piso: +(CFG.brakeFloor * CFG.shipMaxSpeed).toFixed(1),
    puntos: new Set(starts).size, giros: new Set(angles.map(a => a.toFixed(3))).size,
    bordes: new Set(bordes).size,
    tope: durs.filter(d => d >= CFG.entryMax - STEP).length,
  };
}, { RUNS, STEP });

const errors = [];
let page = null;

// El mundo mide siempre baseHeight de alto, asi que lo que cambia entre
// aparatos es el ancho: una tele ancha obliga a la nave a cruzar mas campo.
for (const vp of [{ width: 1280, height: 720 }, { width: 800, height: 600 }, { width: 2560, height: 1080 }]) {
  page = await browser.newPage({ viewport: vp });
  page.on('pageerror', e => { if (!KNOWN_NOISE(e)) errors.push(String(e)); });
  await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof startGame === 'function');
  const cfg = await page.evaluate(() => ({ pad: CFG.entryPad, brake: CFG.entryBrake }));
  const r = await sample();

  console.log(`\nmundo ${r.W}x${r.H} (viewport ${vp.width}x${vp.height})`);
  check('nace quieta', r.quieta);
  check('nace fuera del campo', r.fuera);
  check('nace por los cuatro bordes', r.bordes === 4);
  check('y no siempre en el mismo punto', r.puntos > RUNS * 0.6, `${r.puntos}/${RUNS} distintos`);
  check('nace con un giro distinto cada vez', r.giros > RUNS * 0.9, `${r.giros}/${RUNS}`);
  check('llega al centro', r.maxDist < 40, `peor ${r.maxDist}px`);
  check('llega al minimo que dan las fisicas', r.maxVel <= r.piso + 4, `peor ${r.maxVel} px/s, piso ${r.piso}`);
  check('llega sin agotar el tope', r.tope === 0, `${r.tope} entradas al tope`);
  check('la entrada dura poco', r.p50 < 2.7, `p50 ${r.p50}s`);
  check('ni el peor caso se hace largo', r.max < 4, `peor ${r.max}s`);
  check('no punta mientras llega', r.maxScore === 0, `max ${r.maxScore}`);
  check('no dispara mientras llega', r.balas === 0);
  check('el campo esta vacio mientras llega', r.rocas === 0, `${r.rocas} rocas-frame`);
  check('no choca mientras llega', r.viva);
  check('no se envuelve por los bordes', r.envuelta === 0);
  check('no se aleja mas de donde nacio', r.maxOut <= cfg.pad + 12, `${r.maxOut}px fuera`);
  check('no tarda en aparecer', r.maxDark < 1.2, `${r.maxDark}s invisible`);
  await page.close();
}

console.log('\nel aviso del relevo');
{
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => { if (!KNOWN_NOISE(e)) errors.push(String(e)); });
  await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate((STEP) => {
    const out = { calladoAlEntrar: true, parpadea: true, anillo: true, seApaga: true };
    for (let n = 0; n < 20; n++) {
      startGame('play');
      let t = 0;
      while (G.entry && t < 12) {
        updatePlay(STEP); t += STEP;
        if (G.entry && G.ready > 0) out.calladoAlEntrar = false;   // el aviso es de la llegada
      }
      if (!(G.ready > 0)) out.parpadea = false;
      if (!G.rings.length) out.anillo = false;
      let u = 0;
      while (G.ready > 0 && u < 3) { updatePlay(STEP); u += STEP; }
      if (u > 1) out.seApaga = false;                              // dura un momento, no la partida
    }
    return out;
  }, STEP);
  check('mientras llega no hay aviso de relevo', r.calladoAlEntrar);
  check('al llegar la nave parpadea', r.parpadea);
  check('y sale un anillo de donde esta', r.anillo);
  check('el parpadeo se apaga solo', r.seApaga);
  await page.close();
}

console.log('\nel campo despues de llegar');
{
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => { if (!KNOWN_NOISE(e)) errors.push(String(e)); });
  await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof startGame === 'function');
  // El campo vacio durante la entrada no puede dejar al jugador solo: al llegar
  // se llena desde cero con la misma rampa que al subir de nivel.
  const r = await page.evaluate((STEP) => {
    const veces = [];
    for (let n = 0; n < 20; n++) {
      startGame('play');
      let t = 0; while (G.entry && t < 12) { updatePlay(STEP); t += STEP; }
      const objetivo = Math.round(6 + 0);            // curve().count al empezar (progreso 0)
      let lleno = null, alLlegar = G.meteors.length;
      for (let i = 0; i < 60 * 8 && lleno === null; i++) {
        updatePlay(STEP);
        if (G.meteors.length >= objetivo) lleno = (i + 1) * STEP;
      }
      veces.push({ alLlegar, lleno });
    }
    return {
      vacioAlLlegar: veces.every(v => v.alLlegar === 0),
      seLlena: veces.every(v => v.lleno !== null),
      peor: +Math.max(...veces.map(v => v.lleno || 99)).toFixed(2),
    };
  }, STEP);
  check('al llegar la pantalla esta limpia', r.vacioAlLlegar);
  check('y el campo se llena enseguida', r.seLlena && r.peor < 6, `peor ${r.peor}s`);
  await page.close();
}

console.log('\ndemo y partidas encadenadas');
{
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => { if (!KNOWN_NOISE(e)) errors.push(String(e)); });
  await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate((STEP) => {
    const corre = (modo) => {
      startGame(modo);
      const entra = G.entry === true && Math.hypot(G.ship.vx, G.ship.vy) === 0;
      let t = 0; while (G.entry && t < 12) { updatePlay(STEP); t += STEP; }
      for (let i = 0; i < 600; i++) updatePlay(STEP);    // 10 s ya con el bot al mando
      return entra && !!G.ship && G.ship.x >= 0 && G.ship.x <= W && G.meteors.length > 0;
    };
    const fondo = corre('attract');       // la demo apagada de detras del menu
    const elegida = corre('demo');        // la del menu, la que ensena
    quitAttract();
    const limpio = G.entry === false && G.ship === null;
    startGame('play');
    const otraVez = G.entry === true && Math.hypot(G.ship.vx, G.ship.vy) === 0;
    return { fondo, elegida, limpio, otraVez };
  }, STEP);
  check('la demo de fondo tambien entra volando', r.fondo);
  check('y la demo elegida del menu tambien', r.elegida);
  check('cortar la demo limpia la entrada', r.limpio);
  check('la partida siguiente vuelve a entrar quieta', r.otraVez);
  await page.close();
}

check('la pagina no lanzo errores', errors.length === 0, errors.join(' | '));

await browser.close();
server.close();
console.log(res.failed ? `\n${res.failed} fallo(s)\n` : '\ntodo correcto\n');
process.exit(res.failed ? 1 : 0);
