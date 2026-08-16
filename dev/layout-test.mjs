/* Comprueba que el juego ocupa exactamente la pantalla visible.
 *
 * El fallo que motiva este archivo: instalado como app quedaba un marco arriba y la
 * parte de abajo cortada. El lienzo se dimensionaba con innerWidth/innerHeight, que
 * incluyen franjas que en pantalla completa no existen.
 *
 *   node dev/layout-test.mjs
 */
import { serve, playwright, reporter, KNOWN_NOISE, ROOT } from './harness.mjs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const { chromium } = playwright();
const { server, base } = await serve();
const [res, check] = reporter();

console.log('\nmanifest y meta');
{
  const mf = JSON.parse(await readFile(join(ROOT, 'manifest.webmanifest'), 'utf8'));
  check('display es fullscreen', mf.display === 'fullscreen', mf.display);
  check('display_override prefiere fullscreen',
        Array.isArray(mf.display_override) && mf.display_override[0] === 'fullscreen',
        JSON.stringify(mf.display_override));
  check('sigue bloqueado en horizontal', mf.orientation === 'landscape', mf.orientation);

  const html = await readFile(join(ROOT, 'index.html'), 'utf8');
  check('el viewport usa viewport-fit=cover', /viewport-fit=cover/.test(html));
  check('la barra de estado de iOS es translucida',
        /apple-mobile-web-app-status-bar-style"\s+content="black-translucent"/.test(html));
  check('el alto usa dvh', /height:100dvh/.test(html));
}

const browser = await chromium.launch();
const page = await (await browser.newContext({
  viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true,
})).newPage();
const errors = [];
page.on('pageerror', e => { if (!KNOWN_NOISE(e)) errors.push(String(e)); });
await page.goto(`${base}/index.html`, { waitUntil: 'load' });
await page.waitForTimeout(400);

console.log('\nel lienzo llena la pantalla');
{
  const m = await page.evaluate(() => {
    const cv = document.getElementById('screen');
    const vv = window.visualViewport;
    return {
      W, H, dpr: DPR,
      vw: Math.floor(vv.width), vh: Math.floor(vv.height),
      cssW: parseFloat(cv.style.width), cssH: parseFloat(cv.style.height),
      bufW: cv.width, bufH: cv.height,
      scrollH: document.documentElement.scrollHeight,
      innerH: window.innerHeight,
      scrolled: window.scrollY,
    };
  });
  check('W/H siguen al visualViewport', m.W === m.vw && m.H === m.vh,
        `W=${m.W} vw=${m.vw} H=${m.H} vh=${m.vh}`);
  check('el lienzo mide lo mismo en CSS', m.cssW === m.W && m.cssH === m.H,
        `${m.cssW}x${m.cssH}`);
  check('el buffer respeta el DPR', m.bufW === Math.floor(m.W * m.dpr) && m.bufH === Math.floor(m.H * m.dpr),
        `${m.bufW}x${m.bufH} dpr=${m.dpr}`);
  check('la pagina no desborda ni se puede desplazar',
        m.scrollH <= m.innerH && m.scrolled === 0, `scrollH=${m.scrollH} innerH=${m.innerH}`);
}

console.log('\nmargenes seguros (notch)');
{
  // No se puede provocar un notch de verdad, pero si forzar la sonda que los lee.
  const safe = await page.evaluate(() => {
    const st = document.createElement('style');
    st.textContent = '#safe{padding:20px 44px 30px 44px !important}';
    document.head.append(st);
    resize();
    return { ...SAFE };
  });
  check('SAFE lee los cuatro margenes',
        safe.t === 20 && safe.r === 44 && safe.b === 30 && safe.l === 44, JSON.stringify(safe));

  const hud = await page.evaluate(() => {
    G.buttons = [];
    drawMuteButton();
    const b = G.buttons.find(x => x.label === 'MUTE');
    return { muteRight: W - (b.x + b.w), W, r: SAFE.r };
  });
  check('el boton de mute se aparta del recorte derecho', hud.muteRight >= hud.r,
        `borde=${hud.muteRight} margen=${hud.r}`);

  const still = await page.evaluate(() => {
    const cv = document.getElementById('screen');
    return { cssW: parseFloat(cv.style.width), W };
  });
  check('el lienzo sigue llegando al borde fisico', still.cssW === still.W,
        `${still.cssW} vs ${still.W}`);
}

check('la pagina no lanzo errores', errors.length === 0, errors.join(' | '));

await browser.close();
server.close();
console.log(res.failed ? `\n${res.failed} fallo(s)\n` : '\ntodo correcto\n');
process.exit(res.failed ? 1 : 0);
