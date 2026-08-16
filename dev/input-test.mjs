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

check('la pagina no lanzo errores', errors.length === 0, errors.join(' | '));

await browser.close();
server.close();
console.log(res.failed ? `\n${res.failed} fallo(s)\n` : '\ntodo correcto\n');
process.exit(res.failed ? 1 : 0);
