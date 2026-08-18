/* Saca el material para mostrar el juego afuera: un GIF del campo en marcha,
 * otro con los carteles de la demo, unas fotos sueltas y la portada de itch.io.
 *
 * Lo que motiva este archivo: el juego no se deja fotografiar a mano. Es un LCD
 * de 144 filas cuantizado a cuatro tonos, asi que una captura de pantalla del
 * sistema operativo lo reescala y le mete medios tonos que en el juego no
 * existen. Y no hay a quien pedirle que juegue para la foto. Las dos cosas las
 * resuelve el bot: el mismo botControl de la demo vuela una partida de verdad,
 * de modo que lo que se graba es el juego jugado, no una pose.
 *
 * El GIF principal NO es la pantalla DEMO. La demo tapa medio cuadro con sus
 * carteles y su franja de motores, que sirven para ensenar pero no para
 * mostrar. Se arranca una partida normal y despues se le prende G.attract, que
 * es lo unico que separa al bot del jugador: queda la pantalla PLAY limpia, con
 * su marcador, y adentro vuela la maquina.
 *
 * El tamano de la ventana no es cualquiera: 576 de alto son 144 filas por 4,
 * asi que cada punto del LCD cae en 4 pixeles exactos y el GIF se puede bajar a
 * la mitad sin romper la reticula. Y se graba en 4:3 y no en 16:9 porque el
 * mundo mide siempre baseHeight de alto: cuanto mas ancha la ventana, mas
 * vacio entra al cuadro y mas chica se ve la nave.
 *
 *   node dev/capture-media.mjs
 */
import { createRequire } from 'node:module';
import { execSync, spawnSync } from 'node:child_process';
import { mkdir, rm, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { serve, playwright, ROOT } from './harness.mjs';

const require = createRequire(import.meta.url);
const OUT = join(ROOT, 'media');
const TMP = join(ROOT, '.capture-tmp');

// 144 filas * 4 = cada punto del LCD ocupa 4 pixeles enteros
const VIEW = { width: 768, height: 576 };

// La direccion publica. La captura corre contra un servidor local, asi que sin
// esto el menu sale anunciando 127.0.0.1 y la foto contradice al juego de verdad.
const SITE = 'https://elpatopotato.github.io/myspacedrift/';

// Igual que Playwright en harness.mjs: el repo no tiene package.json a
// proposito, asi que ffmpeg se busca donde este.
function ffmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try { return require('ffmpeg-static'); } catch {}
  try { return require(join(execSync('npm root -g').toString().trim(), 'ffmpeg-static')); } catch {}
  for (const c of ['ffmpeg', '/usr/bin/ffmpeg']) {
    if (spawnSync(c, ['-version'], { stdio: 'ignore' }).status === 0) return c;
  }
  console.error('Falta ffmpeg. Instalalo con:  npm i -g ffmpeg-static');
  process.exit(2);
}

const FF = ffmpeg();
const run = (args) => {
  const r = spawnSync(FF, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  if (r.status !== 0) { console.error(r.stderr?.toString().split('\n').slice(-12).join('\n')); process.exit(1); }
};

/* Los GIF no salen del recordVideo de Playwright, y no por gusto: el webm que
 * escribe no comparte reloj con la pagina. Una toma de 21 segundos de reloj
 * salio durando 37,92 — el screencast entrega cuadros cuando puede y el webm
 * los guarda a 25 fps fijos —, asi que cortar por segundo cae en cualquier
 * lado: el GIF de la demo terminaba mostrando el menu.
 *
 * Con capturas sueltas no hay reloj que adivinar. Se piden n cuadros seguidos,
 * se mide cuanto tardaron de verdad y se arma el GIF a esos mismos fps, que es
 * lo que lo deja andando a velocidad real.
 *
 * OJO al numero que imprime: los fps salen de lo rapido que la maquina pueda
 * sacar capturas, asi que con la maquina ocupada baja y el GIF sale a tirones
 * aunque dure lo mismo. Abajo de ~12 conviene repetir la toma con la maquina
 * libre en vez de publicar ese GIF.
 */
async function frames(page, dir, seconds) {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const t0 = Date.now();
  let i = 0;
  while (Date.now() - t0 < seconds * 1000) {
    await page.screenshot({ path: join(dir, `f-${String(i++).padStart(4, '0')}.png`) });
  }
  return { n: i, fps: i / ((Date.now() - t0) / 1000) };
}

// Un GIF de 4 tonos tenidos no necesita 256 colores; recortar la paleta y
// apagar el difuminado es lo que mantiene los bordes duros y el archivo chico.
function gif(dir, dst, { fps, width }) {
  const vf = `scale=${width}:-1:flags=neighbor,split[a][b];`
           + `[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=none`;
  run(['-y', '-framerate', fps.toFixed(3), '-i', join(dir, 'f-%04d.png'),
       '-vf', vf, '-loop', '0', dst]);
}

await rm(TMP, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
const TMP_PLAY = join(TMP, 'play'), TMP_DEMO = join(TMP, 'demo');

const { chromium } = playwright();
const { server, base } = await serve();
const browser = await chromium.launch();

/* --------- 1) el GIF del juego: partida normal, pero la vuela el bot --------- */
{
  const ctx = await browser.newContext({ viewport: VIEW, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(600);

  // PLAY deja la pantalla limpia; attract pone al bot a los mandos.
  //
  // Y se le devuelven las vidas cada tanto. No es para inflar nada: el campo se
  // puebla con el PUNTAJE, no con el reloj — la cuenta de rocas de curve() va de
  // 6 a 30 sobre los 26000 puntos — y el bot con dos vidas muere y vuelve a
  // cero antes de que el campo se llene, asi que sin esto lo unico que se puede
  // grabar es el nivel 1 con seis rocas. Lo que se ve en el GIF es una pantalla
  // que el juego da de verdad; lo unico que se saltea es el camino hasta ella.
  // Tambien se limpia 'damaged' o la nave sale con el casco partido toda la toma.
  await page.evaluate(() => {
    Sfx.quiet = true; startGame('play'); G.attract = true;
    setInterval(() => { if (G.ship) { G.ship.lives = CFG.lives; G.ship.damaged = false; } }, 500);
  });

  // No se empieza a tomar "al rato" sino a un PUNTAJE. El bot es bueno y si se
  // lo deja correr por reloj termina arriba de los 26000, donde la curva ya
  // llego al tope: treinta piedritas minimas repartidas por toda la pantalla,
  // que en un GIF se leen como ruido y no como un campo. GOAL cae donde ya hay
  // rocas de sobra pero todavia son grandes como para verse.
  const GOAL = 9000;
  await page.waitForFunction(goal => G.score >= goal, GOAL, { timeout: 420000, polling: 250 });

  const st = await page.evaluate(() => ({ score: Math.floor(G.score), level: G.level, rocks: G.meteors.length }));
  console.log(`  juego   score ${st.score}  nivel ${st.level}  rocas ${st.rocks}`);

  await page.screenshot({ path: join(OUT, 'shot-play.png') });
  const t = await frames(page, TMP_PLAY, 10);
  console.log(`  juego   ${t.n} cuadros a ${t.fps.toFixed(1)} fps`);
  await ctx.close();
  gif(TMP_PLAY, join(OUT, 'gameplay.gif'), { fps: t.fps, width: 768 });
}

/* --------- 2) el GIF de la demo: los carteles que explican los mandos --------- */
{
  const ctx = await browser.newContext({ viewport: VIEW, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(600);

  // El primer cartel ('THE MACHINE IS FLYING') explica la demo, no el juego.
  // Un tick entero del reloj de carteles lo saltea y deja el que sirve afuera:
  // 'THE ENGINE NEVER STOPS'.
  await page.evaluate(() => { Sfx.quiet = true; Demo.reset(); activate('DEMO'); Demo.tick(CFG.demoCardTime); });

  // La demo elegida y la demo de fondo del menu se parecen lo suficiente como
  // para colar una por otra en un GIF: las dos tienen al bot volando. La que
  // sirve es la que tiene pantalla propia, asi que se comprueba.
  const scr = await page.evaluate(() => screen);
  if (scr !== 'DEMO') { console.error(`la demo no arranco: screen=${scr}`); process.exit(1); }

  // Se toma justo el cartel que se quiere, no un tramo elegido por reloj.
  await page.waitForFunction(() => Demo.card[0] === 'THE ENGINE NEVER STOPS',
                             null, { timeout: 30000, polling: 100 });
  const t = await frames(page, TMP_DEMO, 9);
  console.log(`  demo    ${t.n} cuadros a ${t.fps.toFixed(1)} fps`);
  await ctx.close();
  gif(TMP_DEMO, join(OUT, 'demo-cards.gif'), { fps: t.fps, width: 768 });
}

/* --------- 3) las fotos sueltas --------- */
{
  // El menu va en 16:9 y no en 4:3 como el resto, porque esta pantalla se mira
  // desde el sillon y esa es la forma que tiene una tele. Ahi la direccion sale
  // en dos renglones, que es como la va a ver casi todo el mundo.
  const page = await (await browser.newContext({
    viewport: { width: 1024, height: VIEW.height }, hasTouch: true,
  })).newPage();
  await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  // Dos cosas tapan el codigo de emparejamiento en el menu y hay que sacar las dos.
  //
  // Una: drawMenu pone el rotulo DEMO en ese mismo renglon mientras corre la
  // demo de fondo, y el codigo solo se dibuja en el 'else'. Con seis segundos
  // quieto (attractDelay) la demo arranca sola, asi que se la corta y se
  // refresca lastTouch justo antes de la foto.
  //
  // Dos: el codigo lo publica el handshake de PeerJS, que necesita unpkg, y una
  // maquina de captura sin salida a internet muestra 'LINK - no internet'. El
  // numero en si es local y ya existe — Link.code() lo genera y lo guarda —, asi
  // que se publica ese: es el mismo que veria el aparato conectado.
  //
  // Y tres: el menu imprime Link.url(), que sale de location, o sea del
  // servidor de pruebas. Se apunta a la direccion publica para que la foto diga
  // lo mismo que dice el juego publicado.
  await page.evaluate((site) => {
    Sfx.quiet = true;
    quitAttract();
    Input.lastTouch = performance.now();
    Link.url = () => site + '?ctrl';
    const st = Link.status();
    if (!st.code) { st.code = Link.code(); st.error = ''; }
  }, SITE);

  // el menu, con el codigo de emparejamiento abajo
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, 'shot-menu.png') });

  // el cartel de nivel: hay que esperarlo, dura poco
  await page.evaluate(() => {
    startGame('play'); G.attract = true;
    setInterval(() => { if (G.ship) { G.ship.lives = CFG.lives; G.ship.damaged = false; } }, 500);
  });
  await page.waitForTimeout(3000);
  const gotBanner = await page.evaluate(() => new Promise(done => {
    const t0 = performance.now();
    (function look() {
      if (G.levelBanner > 0) return done(true);
      if (performance.now() - t0 > 60000) return done(false);
      requestAnimationFrame(look);
    })();
  }));
  if (gotBanner) await page.screenshot({ path: join(OUT, 'shot-level.png') });
  else console.log('  aviso   no se alcanzo un cambio de nivel, sin shot-level.png');

  // la tabla de records, con diez filas puestas a mano para que no salga vacia
  await page.evaluate(async () => {
    const demo = [['ACE', 24810, 9], ['BOT', 19240, 8], ['ZZZ', 15600, 7], ['MAX', 11080, 6],
                  ['LOU', 8420, 5], ['RAY', 6100, 5], ['JIM', 4390, 4], ['ANA', 2870, 3],
                  ['KIM', 1540, 2], ['NIL', 720, 2]];
    await Store.save(demo.map(([i, s, l]) => ({ i, s, l })));
    hs.fromRun = false; hs.mine = -1; screen = 'SCORES';
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(OUT, 'shot-scores.png') });
}

/* --------- 4) la portada de itch.io: 630x500 exactos --------- */
{
  // itch pide 630x500 para la tarjeta del juego. No se recorta una foto de otro
  // tamano: el juego llena el contenedor que le den, asi que se le da una
  // ventana de 630x500 y lo que sale ya es la portada, con la reticula bien.
  const page = await (await browser.newContext({
    viewport: { width: 630, height: 500 }, hasTouch: true,
  })).newPage();
  await page.goto(`${base}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    Sfx.quiet = true; startGame('play'); G.attract = true;
    setInterval(() => { if (G.ship) { G.ship.lives = CFG.lives; G.ship.damaged = false; } }, 500);
  });
  // Menos puntaje que el GIF: en una tarjeta chica un campo muy poblado se lee
  // como ruido, pero el nivel 1 con seis rocas se lee como vacio.
  await page.waitForFunction(() => G.score >= 3500, null, { timeout: 300000, polling: 250 });
  const st = await page.evaluate(() => ({ score: Math.floor(G.score), level: G.level, rocks: G.meteors.length }));
  console.log(`  portada score ${st.score}  nivel ${st.level}  rocas ${st.rocks}`);
  await page.screenshot({ path: join(OUT, 'cover-630x500.png') });
  await page.context().close();
}

await browser.close();
server.close();
await rm(TMP, { recursive: true, force: true });

for (const f of (await readdir(OUT)).sort()) console.log(`  ${f}`);
console.log('\nlisto\n');
