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
    // Wpx/Hpx son los px CSS reales. W/H son unidades de mundo (el alto vale
    // siempre CFG.baseHeight), asi que no sirven para comparar contra el viewport.
    return {
      W: Wpx, H: Hpx, dpr: DPR,
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

  // Se mide el icono, no su caja de toque: la caja se deja mas grande a proposito para
  // que el dedo la acierte, y que ese margen invisible roce el recorte no molesta.
  const hud = await page.evaluate(() => {
    const m = muteIcon();
    return { iconRight: (LW - (m.x + 8 * m.s)) / PIX, iconTop: m.y / PIX, r: SAFE.r, t: SAFE.t };
  });
  check('el icono de mute se aparta del recorte derecho', hud.iconRight >= hud.r,
        `borde=${hud.iconRight.toFixed(1)} margen=${hud.r}`);
  check('y del recorte de arriba', hud.iconTop >= hud.t,
        `borde=${hud.iconTop.toFixed(1)} margen=${hud.t}`);

  const still = await page.evaluate(() => {
    const cv = document.getElementById('screen');
    return { cssW: parseFloat(cv.style.width), W: Wpx };
  });
  check('el lienzo sigue llegando al borde fisico', still.cssW === still.W,
        `${still.cssW} vs ${still.W}`);
}

console.log('\nla direccion de emparejamiento entra en la pantalla');
{
  // El fallo: 'PHONE elpatopotato.github.io/myspacedrift/?ctrl' mide 281 puntos
  // y el LCD no pasa de lcdCols, asi que el renglon que hay que tipear en el
  // celular salia cortado por los dos lados. Ahora se parte en dos, y partirlo
  // hace crecer el bloque: el reparto vertical de drawMenu tiene que contar con
  // eso o el codigo se come la franja de controles.
  //
  // No se recalcula la formula aca —seria copiarla y se desincronizaria—: se
  // mira Menu.layout, que es el reparto que el dibujo publica de verdad.
  for (const [w, h] of [[768, 576], [1024, 576], [1920, 1080], [1366, 768], [1280, 576], [2560, 1080]]) {
    const p = await (await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true })).newPage();
    await p.goto(`${base}/index.html`, { waitUntil: 'load' });
    await p.waitForTimeout(300);
    const r = await p.evaluate(async () => {
      Link.url = () => 'https://elpatopotato.github.io/myspacedrift/?ctrl';
      const st = Link.status(); st.code = Link.code(); st.error = '';
      quitAttract();                       // con la demo puesta el menu dibuja DEMO y no el codigo
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      const rows = linkRows(LW / 2, 'center');
      return {
        widest: Math.max(...rows.map(s => Font.width(s, 1))), room: LW - T,
        // el hit-test llama tintBox() sin argumento; el dibujo le pasa su escala
        LW, LH: LH(), tintHit: tintBox().w, tintDrawn: tintBox(Menu.layout.ts).w,
        ...Menu.layout,
      };
    });
    check(`${w}x${h}: la direccion no se corta`, r.widest <= r.room,
          `${r.widest} de ${r.room} (${r.rows} renglon/es, LCD ${r.LW}x${r.LH})`);
    check(`${w}x${h}: el codigo no pisa la franja`, r.codeY + r.codeH <= r.hintsY,
          `codigo hasta ${r.codeY + r.codeH}, franja en ${r.hintsY}`);
    check(`${w}x${h}: el cuadro no le trepa al titulo`, r.boxTop >= r.titleEnd,
          `cuadro en ${r.boxTop}, titulo hasta ${r.titleEnd}`);
    // El codigo es lo ultimo que cede: antes se cae la ayuda y baja el titulo.
    check(`${w}x${h}: el codigo sigue en grande`, r.codeS === 2,
          `escala ${r.codeS} (titulo en ${r.ts}, ayuda ${r.help ? 'si' : 'no'})`);
    // el easter egg se toca sobre el titulo: la zona del hit-test tiene que
    // medir lo mismo que la que se dibujo, o se toca donde no hay nada
    check(`${w}x${h}: el area del tinte coincide con el titulo dibujado`,
          r.tintHit === r.tintDrawn, `hit ${r.tintHit} vs dibujo ${r.tintDrawn}`);
    await p.context().close();
  }
}

check('la pagina no lanzo errores', errors.length === 0, errors.join(' | '));

await browser.close();
server.close();
console.log(res.failed ? `\n${res.failed} fallo(s)\n` : '\ntodo correcto\n');
process.exit(res.failed ? 1 : 0);
