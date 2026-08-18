/* Cinco fotos mas para la ficha, las que faltaban: media/shot-demo.png,
 * shot-shield.png, shot-split.png, shot-tint.png y shot-phone.png.
 *
 * capture-media.mjs ya saca las cuatro basicas —menu, campo, cartel de nivel y
 * tabla de records— y ademas graba los GIFs, que tarda minutos. Estas van
 * aparte porque son otra cosa: no enseñan las pantallas, enseñan lo que el juego
 * TIENE y una foto del campo no cuenta. Y al no grabar video, salen en segundos.
 *
 * Igual que alli, no hay montaje: cada foto es el juego corriendo, volado por el
 * mismo bot de la demo. Lo unico que se hace es ponerlo en la situacion —darle
 * el escudo, partir una roca, girar el vidrio— y esperar. La captura del sistema
 * operativo no sirve: reescala el LCD y le mete medios tonos que no existen.
 *
 * Lo que aporta cada una:
 *
 *   demo    la maquina jugando, con el cartel que explica y la franja de abajo
 *           encendida en el motor que esta apretando. Es el modo que enseña.
 *   pickups los dos recolectables juntos, que jugando casi nunca coinciden: el
 *           escudo y la reparacion no se distinguen por color sino por forma,
 *           giro y ondas, y eso solo se ve poniendolos uno al lado del otro.
 *   split   una roca partiendose en dos, con su polvo. Es la mecanica que no se
 *           ve en una foto cualquiera porque dura un instante.
 *   tint    el mismo menu con el cristal verde: el easter egg del tinte, y la
 *           unica foto en color de todas.
 *   phone   el celular haciendo de mando, que es la mitad del juego y no sale en
 *           ninguna captura de la tele.
 *
 *   node dev/capture-shots.mjs
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { serve, playwright, ROOT } from './harness.mjs';

const OUT = join(ROOT, 'media');

// La direccion publica. La captura corre contra un servidor local, asi que sin
// esto el menu sale anunciando 127.0.0.1 y la foto contradice al juego de verdad.
const SITE = 'https://elpatopotato.github.io/myspacedrift/';
// El codigo es el mismo que sale en shot-menu.png: la foto del celular y la de
// la tele tienen que poder mirarse juntas.
const CODE = '337282';

// 576 = 144 filas por 4, o sea cada punto del LCD en cuatro pixeles enteros
// (igual que capture-media.mjs). El campo va en 4:3, porque el mundo mide
// siempre lo mismo de alto y cuanto mas ancha la ventana mas vacio entra y mas
// chica se ve la nave; el menu va en 16:9, que es la forma de la tele desde la
// que se mira.
const TV    = { width: 768, height: 576 };
const WIDE  = { width: 1024, height: 576 };
const PHONE = { width: 390, height: 844 };

/* El juego se congela EN el cuadro que sirve, y ademas se prueba DESPUES de que
 * ese cuadro se dibujo. Las dos cosas hacen falta:
 *
 * Mirar el estado desde un rAF suelto no sirve, aunque se corte el bucle en el
 * acto: el rAF del script y el del juego caen en la misma tanda y el del juego
 * puede correr despues, asi que lo que se fotografia es el cuadro SIGUIENTE al
 * que se aprobo. Con cosas que duran dos cuadros —el motor que la maquina tiene
 * apretado ahora mismo— eso es la diferencia entre la foto que se buscaba y otra:
 * la primera version de este archivo pedia un solo motor y salio la de freno.
 *
 * Asi que se envuelve 'frame', que es el bucle del juego. Se deja que actualice y
 * dibuje, y recien ahi se pregunta: si el cuadro sirve, lo que hay en pantalla es
 * exactamente lo que se acaba de aprobar. La condicion viaja como texto porque
 * page.evaluate no deja pasar funciones con contexto.
 *
 * Y para cortar no alcanza con pisar requestAnimationFrame: el juego se reagenda
 * en la PRIMERA linea de frame, o sea que cuando se decide congelar ya hay un
 * cuadro pedido, y ese se dibuja igual encima del bueno. Por eso hay una bandera:
 * el cuadro que ya estaba pedido llega, ve que esto termino y se va sin dibujar.
 */
const freezeWhen = (page, cond, ms = 120000) =>
  page.evaluate(([src, limit]) => new Promise((ok, fail) => {
    const test = new Function('return (' + src + ')')();
    const orig = frame;
    const t0 = performance.now();
    let dead = false;
    // 'frame' vuelve a su sitio para poder pedir un cuadro suelto a mano despues
    // de congelar; el que ya estaba pedido se va por la bandera, no por esto.
    const stop = (end, arg) => { dead = true; window.requestAnimationFrame = () => 0; frame = orig; end(arg); };
    frame = (t) => {
      if (dead) return;                         // el cuadro que ya estaba pedido: no dibuja
      orig(t);                                  // el juego actualiza y dibuja
      let good = false;
      try { good = !!test(); } catch (e) { good = false; }   // el estado todavia no existe
      if (good) return stop(ok);
      if (performance.now() - t0 > limit) stop(fail, new Error('no se llego a: ' + src));
    };
  }), [cond.toString(), ms]);

// Lo mismo pero contando cuadros dibujados: para lo que se provoca a mano y hay
// que dejar madurar un momento (las mitades de una roca separandose).
const freezeAfter = (page, frames) =>
  page.evaluate((n) => new Promise(ok => {
    const orig = frame;
    let dead = false;
    frame = (t) => {
      if (dead) return;
      orig(t);
      if (--n <= 0) { dead = true; window.requestAnimationFrame = () => 0; frame = orig; ok(); }
    };
  }), frames);

/* Un cuadro suelto, con el juego ya congelado: se le cambia algo a la escena y
 * se vuelve a dibujar. El reloj apenas avanza —dt es lo que tardo la llamada— asi
 * que la partida se queda donde estaba; lo unico que cambia es lo que se puso. */
const renderOnce = (page) => page.evaluate(() => frame(performance.now()));

/* El bot de la demo vuela una partida de verdad y se le devuelven las vidas: es
 * el mismo arreglo de capture-media.mjs y por el mismo motivo. El campo se
 * puebla con el PUNTAJE, no con el reloj, asi que un bot con dos vidas muere y
 * vuelve a cero antes de que el campo se llene y lo unico fotografiable seria el
 * nivel 1 con seis rocas. Lo que se ve es una pantalla que el juego da de
 * verdad; lo unico que se saltea es el camino hasta ella. */
const flyBot = (page) => page.evaluate(() => {
  Sfx.quiet = true;
  startGame('play');
  G.attract = true;
  setInterval(() => { if (G.ship) { G.ship.lives = CFG.lives; G.ship.damaged = false; } }, 500);
});

const { chromium } = playwright();
const { server, base } = await serve();
const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });

const open = async (viewport, opts = {}) => {
  const ctx = await browser.newContext({ viewport, hasTouch: true, ...opts.context });
  if (opts.init) await ctx.addInitScript(opts.init);
  const page = await ctx.newPage();
  await page.goto(`${base}/index.html${opts.query || ''}`, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  return page;
};

// Sin argumentos salen las cinco; con nombres, solo esas ('node dev/capture-shots.mjs
// demo split'). Cada foto espera a que el bot llegue a su situacion, asi que
// repetir una sola mientras se la ajusta ahorra el resto.
const only = process.argv.slice(2);
const want = (name) => !only.length || only.includes(name);

const done = [];
const save = async (page, name, note) => {
  await page.screenshot({ path: join(OUT, name) });
  done.push(`  ${name.padEnd(18)} ${note}`);
};

/* --------- 1) la demo: el cartel que explica y el motor encendido --------- */
if (want('demo')) {
  const page = await open(TV);
  // El primer cartel ('THE MACHINE IS FLYING') explica la demo, no el juego. Un
  // tick entero del reloj de carteles lo saltea.
  await page.evaluate(() => {
    Sfx.quiet = true;
    Demo.reset(); activate('DEMO'); Demo.tick(CFG.demoCardTime);
    setInterval(() => { if (G.ship) { G.ship.lives = CFG.lives; G.ship.damaged = false; } }, 500);
  });
  // Y se espera al cuadro que lo tiene todo: el cartel que enseña a girar, la
  // maquina con UN motor apretado —que es lo que enciende la franja de abajo—,
  // el campo ya poblado, y la nave en la mitad de arriba y lejos de los bordes:
  // abajo queda detras del cartel, que se dibuja encima del campo, y cruzando un
  // borde se dibuja partida en los dos lados (§5), que en una foto quieta no se
  // entiende.
  await freezeWhen(page, () => screen === 'DEMO' && !G.entry
    && Demo.card[0] === 'ONE SIDE TURNS'
    && G.ship && G.ship.alive && (G.ship.left !== G.ship.right)
    && G.ship.y < H * 0.52 && G.ship.y > H * 0.20
    && G.ship.x > W * 0.15 && G.ship.x < W * 0.85
    && G.meteors.length >= 9);
  await save(page, 'shot-demo.png', 'la maquina jugando, con cartel y franja encendida');
}

/* --------- 2) los recolectables: escudo y reparacion, uno al lado del otro --------- */
if (want('pickups')) {
  const page = await open(TV);
  await flyBot(page);
  // La nave, en sitio despejado y lejos del marcador: los dos recolectables van
  // a su alrededor y tienen que caber sin pisar nada.
  await page.waitForFunction(() => G.score > 1500 && !G.entry && G.meteors.length >= 7
    && G.ship && G.ship.alive && G.ship.invuln <= 0
    && G.ship.x > W * 0.30 && G.ship.x < W * 0.62
    && G.ship.y > H * 0.42 && G.ship.y < H * 0.80,
    null, { timeout: 300000, polling: 100 });
  // Primero se congela y despues se ponen: con la partida quieta, el sitio de
  // cada uno se puede elegir mirando donde NO hay nada. Puestos antes, la roca
  // que venia entrando se les monta encima en los cuadros siguientes.
  await freezeWhen(page, () => G.ship && G.ship.alive);
  await page.evaluate(() => {
    const s = G.ship;
    // Se ponen los DOS. El de reparacion solo cae si hay algo que reparar, asi
    // que juntos no se ven casi nunca jugando, y son justo lo que hay que
    // enseñar junto: no se distinguen por color —en cuatro tonos el color no
    // existe— sino por forma, giro y ondas (§8). Uno al lado del otro, esa
    // diferencia se ve de una: la cruz recta y quieta contra el nucleo redondo
    // con sus tres satelites en orbita.
    //
    // El sitio no se elige a ojo: se prueban dieciseis alrededor de la nave y se
    // queda el que tenga la roca mas lejos. A esta escala el recolectable mide
    // cinco pixeles, asi que encima de una roca directamente no se ve.
    const clear = (x, y, taken) => {
      if (x < 60 || x > W - 60 || y < 52 || y > H - 52) return -1;
      let d = Math.min(x, W - x, y - 44, H - y);          // los bordes y la franja del marcador
      for (const m of G.meteors) d = Math.min(d, Math.hypot(m.x - x, m.y - y) - m.r);
      for (const p of taken) d = Math.min(d, Math.hypot(p.x - x, p.y - y) * 0.5);
      return d;
    };
    const spot = (taken) => {
      let best = null, score = -Infinity;
      for (let i = 0; i < 16; i++) {
        const a = i * TAU / 16, r = 95;
        const x = s.x + Math.cos(a) * r, y = s.y + Math.sin(a) * r;
        const d = clear(x, y, taken);
        if (d > score) { score = d; best = { x, y }; }
      }
      return best;
    };
    const put = (kind, t) => {
      const at = spot(G.pickups);
      G.pickups.push({ x: at.x, y: at.y, vx: 0, vy: 0, t, r: 13 * CFG.pickupScale, kind });
    };
    put('shield', 0.9);      // ondas hacia afuera: irradia
    put('repair', 1.7);      // ondas hacia adentro: absorbe
  });
  await renderOnce(page);
  await save(page, 'shot-pickups.png', 'los dos recolectables: escudo y reparacion');
}

/* --------- 3) la particion: una roca abriendose en dos --------- */
if (want('split')) {
  const page = await open(TV);
  await flyBot(page);
  // La roca tiene que ser grande Y estar en la franja del medio: partida contra
  // el borde se sale del cuadro, y partida arriba se le monta al marcador.
  const central = `(m) => m.x > W * 0.18 && m.x < W * 0.82 && m.y > H * 0.28 && m.y < H * 0.80`;
  await page.waitForFunction((src) => {
    const inside = new Function('return (' + src + ')')();
    const min = CFG.splitMinRadius / Math.sqrt(CFG.splitKeep);
    return G.score > 2500 && !G.entry && G.meteors.some(m => m.r > min + 4 && inside(m));
  }, central, { timeout: 300000, polling: 100 });

  // Se parte la mas grande de esa franja: es la que deja dos mitades que se
  // leen. La parte splitMeteor, o sea exactamente lo que hace una bala; lo unico
  // que se saltea es esperar a que el bot acierte ese tiro.
  const cut = await page.evaluate((src) => {
    const inside = new Function('return (' + src + ')')();
    const min = CFG.splitMinRadius / Math.sqrt(CFG.splitKeep);
    let best = -1, score = -Infinity;
    G.meteors.forEach((m, i) => {
      if (m.r <= min + 4 || !inside(m)) return;
      if (m.r > score) { score = m.r; best = i; }
    });
    if (best < 0) return false;
    // Partir paga el polvo, y un nivel nuevo disuelve el campo entero: seria
    // fotografiar una pantalla vacia.
    G.nextLevelAt = Infinity;
    return splitMeteor(best, CFG.bulletSpeed);
  }, central);
  if (!cut) { console.error('no habia ninguna roca lo bastante grande para partir'); process.exit(1); }

  // Diez cuadros: lo justo para que las dos mitades se despeguen y se lean como
  // dos, y para que el anillo del golpe pase por fuera de ellas en vez de
  // encerrarlas. Mas tarde el polvo ya se apago y no queda el golpe, queda una
  // roca chica al lado de otra.
  await freezeAfter(page, 10);
  await save(page, 'shot-split.png', 'una roca partida en dos, con su polvo');
}

/* --------- 4) el tinte: el mismo menu con el cristal verde --------- */
if (want('tint')) {
  // Va en 4:3 y no en 16:9 como shot-menu.png por una razon concreta: el nombre
  // del tinte se dibuja justo encima del cuadro del menu, y en una pantalla de
  // 16:9 el reparto del alto sube ese cuadro hasta taparlo (§21.2). El color se
  // ve igual en las dos, pero la foto que explica el easter egg es esta.
  const page = await open(TV);
  await page.evaluate(({ site, code }) => {
    Sfx.quiet = true;
    quitAttract();                       // sin esto la demo de fondo arranca sola a los 6 s
    Input.lastTouch = performance.now();
    Link.url = () => site + '?ctrl';      // el menu imprime location, que aca es el servidor de pruebas
    const st = Link.status();
    st.code = code; st.error = '';       // el mismo codigo que la tele en shot-menu.png y el celular
    Tint.cycle();                        // MONO -> GREEN, y con el nombre debajo del titulo
  }, { site: SITE, code: CODE });
  await freezeAfter(page, 3);
  await save(page, 'shot-tint.png', 'el menu con el vidrio verde (easter egg)');
}

/* --------- 5) el celular: la pantalla del mando --------- */
if (want('phone')) {
  // PeerJS viene de un CDN y la maquina de captura puede no tener salida a
  // internet; sin el, la pantalla del mando dice 'no internet — cannot pair' y la
  // foto contradice al juego publicado. Se le da un Peer que no hace nada: lo
  // que se fotografia es la pantalla de emparejamiento de verdad, con su CSS y
  // su texto. Lo unico que no ocurre es la conexion, que en una foto no se ve.
  const page = await open(PHONE, {
    query: '?ctrl',
    context: { deviceScaleFactor: 2, isMobile: true },   // el mando es DOM: aca el pixel doble suma
    init: () => {
      if (!window.Peer) {
        window.Peer = class { on() {} connect() { return { on() {}, send() {}, open: false }; } destroy() {} };
      }
    },
  });
  await page.evaluate((code) => {
    const input = document.getElementById('ctrl-code');
    if (!input) throw new Error('la pantalla del mando no se dibujo');
    input.value = code;                  // el mismo codigo que muestra la tele en shot-menu.png
  }, CODE);
  await save(page, 'shot-phone.png', 'el celular de mando, con el codigo de la tele');
}

await browser.close();
server.close();
for (const line of done) console.log(line);
console.log('\nlisto\n');
