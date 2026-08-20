/* Comprueba que ningun control se queda pegado.
 *
 * El fallo que motiva este archivo: si el navegador daba por terminado un toque sin
 * mandar pointerup — cambiar de app, bloquear la pantalla, un gesto del sistema que se
 * traga el dedo — el puntero se quedaba en Input.pointers para siempre. La nave giraba
 * sola y la unica salida era cerrar la pestaña.
 *
 *   node dev/input-test.mjs
 *
 * Usa toques REALES por CDP (Input.dispatchTouchEvent), no eventos sinteticos: un
 * PointerEvent fabricado a mano no obtiene captura de puntero, asi que no reproduce
 * el camino que importa.
 */
import { serve, playwright, reporter, KNOWN_NOISE } from './harness.mjs';

const { chromium } = playwright();
const { server, base } = await serve();
const browser = await chromium.launch();
const page = await (await browser.newContext({
  viewport: { width: 800, height: 400 }, hasTouch: true, isMobile: true,
})).newPage();
const errors = [];
page.on('pageerror', e => { if (!KNOWN_NOISE(e)) errors.push(String(e)); });
await page.goto(`${base}/index.html`, { waitUntil: 'load' });
await page.waitForTimeout(400);

const cdp = await page.context().newCDPSession(page);
// Los puntos necesitan id propio: sin el, Chromium funde varios dedos en un solo puntero.
const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', {
  type, touchPoints: type === 'touchEnd' || type === 'touchCancel' ? [] : [{ x, y, id: 0 }],
});
const state = () => page.evaluate(() => {
  Input.update();
  return { n: Input.pointers.size, l: Input.left, r: Input.right, kl: Key.left, kr: Key.right };
});
// Hay que levantar el dedo anterior antes de empezar otro caso: si no, Chromium trata el
// siguiente touchStart como un movimiento del que ya estaba y el caso mide otra cosa.
const reset = async () => {
  // touchEnd sin un toque vivo es un error del protocolo, no un fallo del juego.
  try { await touch('touchEnd'); } catch {}
  await page.evaluate(() => { Input.pointers.clear(); Key.left = Key.right = false; });
};

// Simula irse a otra app / apagar la pantalla: hay que falsear hidden Y visibilityState,
// son getters distintos y el juego lee document.hidden.
const goHidden = () => page.evaluate(() => {
  Object.defineProperty(document, 'hidden', { value: true, configurable: true });
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
});

const [res, check] = reporter();

console.log('\ntoque real');
await touch('touchStart', 100, 200);
let s = await state();
check('un dedo en la mitad izquierda registra izquierda', s.n === 1 && s.l === true && s.r === false,
      JSON.stringify(s));
check('la captura de puntero se concede', await page.evaluate(() =>
  document.getElementById('screen').hasPointerCapture(
    [...Input.pointers.keys()].find(k => typeof k === 'number'))) === true);
await touch('touchEnd');
s = await state();
check('al levantar el dedo se suelta', s.n === 0 && s.l === false, JSON.stringify(s));

console.log('\nformas de perder el pointerup');
{
  await reset(); await touch('touchStart', 100, 200);
  check('antes de cambiar de app hay un dedo', (await state()).n === 1);
  await goHidden();
  s = await state();
  check('cambiar de app suelta el dedo', s.n === 0 && s.l === false, JSON.stringify(s));

  await reset(); await touch('touchStart', 100, 200);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  check('blur suelta el dedo', (await state()).n === 0);

  await reset(); await touch('touchStart', 100, 200);
  await touch('touchCancel');
  check('pointercancel suelta el dedo', (await state()).n === 0);

  // Nota: no se comprueba lostpointercapture con el dedo porque Chromium usa captura
  // implicita para los toques y ese evento no llega a dispararse. El listener sigue
  // puesto por raton y lapiz; las vias que de verdad cubren el fallo son las de arriba.
}

console.log('\nteclado');
{
  await reset();
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })));
  s = await state();
  check('espacio pulsa ambos lados', s.kl === true && s.kr === true, JSON.stringify(s));
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  s = await state();
  check('blur suelta las teclas', s.kl === false && s.kr === false, JSON.stringify(s));

  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })));
  await goHidden();
  s = await state();
  check('cambiar de app suelta las teclas', s.kl === false, JSON.stringify(s));
}

console.log('\nmultitoque');
{
  await reset(); await page.waitForTimeout(50);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: [{ x: 100, y: 200, id: 0 }, { x: 700, y: 200, id: 1 }] });
  s = await state();
  check('dos dedos registran ambos lados', s.n === 2 && s.l && s.r, JSON.stringify(s));
  await touch('touchEnd');
  check('levantarlos suelta los dos', (await state()).n === 0);
}

console.log('\nel mando del celular');
{
  // El mando es DOM, no canvas: dos botones grandes que se encienden mientras el
  // dedo los aprieta. Se vigila lo mismo que en la pantalla —que nada quede
  // pegado— y ademas que la luz diga la verdad, porque es la unica respuesta que
  // tiene quien sostiene el celular: la partida se ve en la otra pantalla.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => {
    // PeerJS sale a internet. Aca solo hace falta que el enlace se abra y que se
    // pueda leer lo que el mando manda del otro lado.
    window.__sent = [];
    window.Peer = class {
      constructor() { this._h = {}; setTimeout(() => this._h.open && this._h.open('x'), 5); }
      on(k, f) { this._h[k] = f; }
      connect() {
        const c = { open: false, _h: {}, on(k, f) { this._h[k] = f; },
                    send(m) { window.__sent.push(m); }, close() {} };
        setTimeout(() => { c.open = true; c._h.open && c._h.open(); }, 10);
        return c;
      }
      destroy() {}
    };
  });
  const ph = await ctx.newPage();
  ph.on('pageerror', e => { if (!KNOWN_NOISE(e)) errors.push('mando: ' + e); });
  await ph.goto(`${base}/index.html?ctrl`, { waitUntil: 'load' });
  await ph.fill('#ctrl-code', '123456');            // seis digitos: conecta solo
  await ph.waitForTimeout(300);

  const pcdp = await ctx.newCDPSession(ph);
  const fingers = (...ps) => pcdp.send('Input.dispatchTouchEvent', {
    type: ps.length ? 'touchStart' : 'touchEnd',
    touchPoints: ps.map(([x, y], i) => ({ x, y, id: i })),
  });
  const pad = () => ph.evaluate(() => ({
    lit: [...document.querySelectorAll('#ctrl-pad .btn')].map(b => b.classList.contains('on')),
    last: window.__sent[window.__sent.length - 1],
    visible: !document.getElementById('ctrl-pad').hidden,
  }));

  check('conectado, los botones reemplazan al teclado numerico', (await pad()).visible);

  await fingers([90, 500]);
  let m = await pad();
  check('apretar la izquierda enciende la izquierda', m.lit[0] && !m.lit[1], JSON.stringify(m.lit));
  check('y manda un dedo en esa mitad de la pantalla',
        m.last.t === 'p' && m.last.a.length === 1 && m.last.a[0][1] < 0.5, JSON.stringify(m.last));

  await fingers([90, 500], [300, 500]);
  m = await pad();
  check('los dos juntos son el freno', m.lit[0] && m.lit[1] && m.last.a.length === 2, JSON.stringify(m.last));

  await fingers();
  m = await pad();
  check('soltar apaga las dos luces', !m.lit[0] && !m.lit[1], JSON.stringify(m.lit));
  check('y le avisa a la pantalla que no queda ningun dedo', m.last.a.length === 0, JSON.stringify(m.last));

  // el fallo que motiva este archivo, visto desde el mando: la app se va a
  // segundo plano con el dedo apoyado y nadie manda el pointerup
  await fingers([90, 500]);
  await ph.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  m = await pad();
  check('irse a segundo plano suelta el boton', !m.lit[0] && m.last.a.length === 0, JSON.stringify(m));
  await ctx.close();
}

check('la pagina no lanzo errores', errors.length === 0, errors.join(' | '));

await browser.close();
server.close();
console.log(res.failed ? `\n${res.failed} fallo(s)\n` : '\ntodo correcto\n');
process.exit(res.failed ? 1 : 0);
