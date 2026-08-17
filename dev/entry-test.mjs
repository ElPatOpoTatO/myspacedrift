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
 *   - llega al centro sin quedarse orbitando (el tope de tiempo es red de
 *     seguridad, no el camino normal)
 *   - mientras llega no punta, no dispara, no choca y no la apuntan
 *   - no se envuelve por los bordes: estando fuera, envolverla la sacaria por
 *     el borde contrario en vez de dejarla entrar
 *   - no se queda mucho rato invisible: la partida no puede empezar con la
 *     pantalla sin nave
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
  const durs = [], scores = [], dists = [], outs = [], darks = [], starts = [], angles = [];
  let quieta = true, fuera = true, viva = true, envuelta = 0, balas = 0;
  for (let n = 0; n < RUNS; n++) {
    startGame('play');
    const s = G.ship;
    if (Math.hypot(s.vx, s.vy) !== 0) quieta = false;
    if (s.x >= 0 && s.x <= W && s.y >= 0 && s.y <= H) fuera = false;
    angles.push(s.a);
    starts.push([Math.round(s.x), Math.round(s.y)].join());
    Input.left = n % 2 === 0; Input.right = n % 3 === 0;
    let t = 0, prev = { x: s.x, y: s.y }, sc = 0, out = 0, dark = 0;
    while (G.entry && t < 12) {
      updatePlay(STEP); t += STEP;
      if (!G.entry) break;                       // el frame de la llegada ya es partida
      sc = G.score;
      balas += G.bullets.length;
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
  }
  durs.sort((a, b) => a - b);
  const max = a => Math.max(...a);
  return {
    W: Math.round(W), H: Math.round(H), quieta, fuera, viva, envuelta, balas,
    p50: +durs[Math.floor(RUNS / 2)].toFixed(2), max: +durs[RUNS - 1].toFixed(2),
    maxScore: +max(scores).toFixed(3), maxDist: +max(dists).toFixed(1),
    maxOut: +max(outs).toFixed(1), maxDark: +max(darks).toFixed(2),
    puntos: new Set(starts).size, giros: new Set(angles.map(a => a.toFixed(3))).size,
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
  const cfg = await page.evaluate(() => ({ arrive: CFG.entryArrive, pad: CFG.entryPad }));
  const r = await sample();

  console.log(`\nmundo ${r.W}x${r.H} (viewport ${vp.width}x${vp.height})`);
  check('nace quieta', r.quieta);
  check('nace fuera del campo', r.fuera);
  check('nace en un punto distinto cada vez', r.puntos > RUNS * 0.9, `${r.puntos}/${RUNS}`);
  check('nace con un giro distinto cada vez', r.giros > RUNS * 0.9, `${r.giros}/${RUNS}`);
  check('llega al centro', r.maxDist <= cfg.arrive + 1, `peor ${r.maxDist}px`);
  check('llega sin agotar el tope', r.tope === 0, `${r.tope} entradas al tope`);
  check('la entrada dura poco', r.max < 4.5, `p50 ${r.p50}s / peor ${r.max}s`);
  check('no punta mientras llega', r.maxScore === 0, `max ${r.maxScore}`);
  check('no dispara mientras llega', r.balas === 0);
  check('no choca mientras llega', r.viva);
  check('no se envuelve por los bordes', r.envuelta === 0);
  check('no se aleja mas de donde nacio', r.maxOut <= cfg.pad + 12, `${r.maxOut}px fuera`);
  check('no tarda en aparecer', r.maxDark < 1.2, `${r.maxDark}s invisible`);
  await page.close();
}

console.log('\nblancos mientras llega');
{
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => { if (!KNOWN_NOISE(e)) errors.push(String(e)); });
  await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof startGame === 'function');
  // Fraccion de meteoros que salen encarados a la nave. En juego una parte
  // nace apuntada o predicha (curve().aimed + .predict); mientras llega, el
  // campo tiene que ser todo al azar, asi que solo queda la coincidencia.
  const r = await page.evaluate(() => {
    const N = 1500;
    const frac = (entrando) => {
      startGame('play');
      const s = G.ship;
      G.entry = entrando;
      s.x = W / 2; s.y = H / 2; s.vx = 0; s.vy = 0;   // mismo blanco en los dos casos
      let n = 0, hubo = 0;
      for (let i = 0; i < N; i++) {
        G.meteors.length = 0;
        spawnMeteor();
        const m = G.meteors[0];
        if (!m) continue;
        hubo++;
        const d = Math.abs(((Math.atan2(s.y - m.y, s.x - m.x) - Math.atan2(m.vy, m.vx) + Math.PI) % (Math.PI * 2)) - Math.PI);
        if (d < 0.06) n++;
      }
      return n / Math.max(1, hubo);
    };
    return { entrando: frac(true), jugando: frac(false) };
  });
  // El campo al azar ya empuja las rocas hacia el centro, asi que la
  // coincidencia sola ronda el 5%: lo que se mide es que la parte apuntada
  // (que en juego lo lleva al doble largo) no exista mientras la nave llega.
  check('en juego los meteoros la encaran', r.jugando > 0.13, `${(r.jugando * 100).toFixed(1)}%`);
  check('mientras llega, solo por coincidencia', r.entrando < 0.09, `${(r.entrando * 100).toFixed(1)}%`);
  await page.close();
}

console.log('\ndemo y partidas encadenadas');
{
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => { if (!KNOWN_NOISE(e)) errors.push(String(e)); });
  await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate((STEP) => {
    startGame('attract');
    const entraDemo = G.entry === true;
    let t = 0; while (G.entry && t < 12) { updatePlay(STEP); t += STEP; }
    for (let i = 0; i < 600; i++) updatePlay(STEP);      // 10 s de demo, ya con el bot al mando
    const demoSigue = !!G.ship && G.ship.x >= 0 && G.ship.x <= W;
    quitAttract();
    const limpio = G.entry === false && G.ship === null;
    startGame('play');
    const otraVez = G.entry === true && Math.hypot(G.ship.vx, G.ship.vy) === 0;
    return { entraDemo, demoSigue, limpio, otraVez };
  }, STEP);
  check('la demo del menu tambien entra volando', r.entraDemo && r.demoSigue);
  check('cortar la demo limpia la entrada', r.limpio);
  check('la partida siguiente vuelve a entrar quieta', r.otraVez);
  await page.close();
}

check('la pagina no lanzo errores', errors.length === 0, errors.join(' | '));

await browser.close();
server.close();
console.log(res.failed ? `\n${res.failed} fallo(s)\n` : '\ntodo correcto\n');
process.exit(res.failed ? 1 : 0);
