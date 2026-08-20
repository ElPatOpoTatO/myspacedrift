/* Comprueba que el lienzo es 16:9 clavado, centrado y sin desbordar la pantalla.
 *
 * El fallo que motivo este archivo: instalado como app quedaba un marco arriba y la
 * parte de abajo cortada. El lienzo se dimensionaba con innerWidth/innerHeight, que
 * incluyen franjas que en pantalla completa no existen. De ahi que se comprobara que
 * el lienzo LLENABA la ventana.
 *
 * Ya no la llena, y es a proposito: la relacion de aspecto esta bloqueada en 16:9
 * para que el juego se vea y se juegue igual en todo aparato, asi que lo que sobra
 * de ventana queda en negro. Lo que hay que comprobar cambio de forma —16:9, entra,
 * centrado— pero el fallo de origen sigue cubierto: nada se sale ni se corta.
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

console.log('\nel lienzo es 16:9, entra en la pantalla y va centrado');
{
  const m = await page.evaluate(() => {
    const cv = document.getElementById('screen');
    const vv = window.visualViewport;
    const r = cv.getBoundingClientRect();
    // Wpx/Hpx son los px CSS de la VENTANA. W/H son unidades de mundo y ahora
    // tambien son constantes, asi que no sirven para comparar contra el viewport.
    return {
      W: Wpx, H: Hpx, dpr: DPR,
      vw: Math.floor(vv.width), vh: Math.floor(vv.height),
      cssW: parseFloat(cv.style.width), cssH: parseFloat(cv.style.height),
      bufW: cv.width, bufH: cv.height,
      left: r.left, top: r.top, right: vv.width - r.right, bottom: vv.height - r.bottom,
      scrollH: document.documentElement.scrollHeight,
      innerH: window.innerHeight,
      scrolled: window.scrollY,
    };
  });
  check('Wpx/Hpx siguen al visualViewport', m.W === m.vw && m.H === m.vh,
        `Wpx=${m.W} vw=${m.vw} Hpx=${m.H} vh=${m.vh}`);
  // Redondear a px enteros deja como mucho medio punto de error en la relacion.
  check('el lienzo es 16:9', Math.abs(m.cssW / m.cssH - 16 / 9) < 0.01,
        `${m.cssW}x${m.cssH} = ${(m.cssW / m.cssH).toFixed(4)}`);
  check('el lienzo entra en la ventana', m.cssW <= m.vw && m.cssH <= m.vh,
        `${m.cssW}x${m.cssH} en ${m.vw}x${m.vh}`);
  check('y toca al menos un par de bordes', m.cssW === m.vw || m.cssH === m.vh,
        `${m.cssW}x${m.cssH} en ${m.vw}x${m.vh}`);   // es el MAYOR 16:9 que entra
  check('las barras negras son iguales de los dos lados',
        Math.abs(m.left - m.right) <= 1 && Math.abs(m.top - m.bottom) <= 1,
        `izq ${m.left.toFixed(1)} der ${m.right.toFixed(1)} arr ${m.top.toFixed(1)} aba ${m.bottom.toFixed(1)}`);
  check('el buffer respeta el DPR',
        m.bufW === Math.floor(m.cssW * m.dpr) && m.bufH === Math.floor(m.cssH * m.dpr),
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

  // SAFE son los margenes del APARATO, y el lienzo ya no llega a los bordes de la
  // ventana: del recorte solo tapa lo que le sobre a la barra negra. Lo que el HUD
  // tiene que esquivar es eso, no el margen entero.
  const cut = await page.evaluate(() => ({
    r: Math.max(0, SAFE.r - BAR.x), t: Math.max(0, SAFE.t - BAR.y),
    barX: BAR.x, barY: BAR.y,
  }));
  check('la barra negra ya cubre parte del recorte',
        cut.r <= safe.r && cut.t <= safe.t,
        `derecho ${safe.r}->${cut.r.toFixed(1)}, arriba ${safe.t}->${cut.t.toFixed(1)} (barra ${cut.barX.toFixed(1)}x${cut.barY.toFixed(1)})`);

  // Se mide el icono, no su caja de toque: la caja se deja mas grande a proposito para
  // que el dedo la acierte, y que ese margen invisible roce el recorte no molesta.
  const hud = await page.evaluate(() => {
    const m = muteIcon();
    return { iconRight: (LW - (m.x + 8 * m.s)) / PIX, iconTop: m.y / PIX };
  });
  check('el icono de mute se aparta del recorte derecho', hud.iconRight >= cut.r,
        `borde=${hud.iconRight.toFixed(1)} recorte=${cut.r.toFixed(1)}`);
  check('y del recorte de arriba', hud.iconTop >= cut.t,
        `borde=${hud.iconTop.toFixed(1)} recorte=${cut.t.toFixed(1)}`);
}

console.log('\nlas pantallas quietas entran en el LCD');
{
  // Tres fallos distintos viven en este bloque.
  //
  // Uno: 'elpatopotato.github.io/myspacedrift/?ctrl' mide 245 puntos y el LCD no
  // pasa de lcdCols, asi que el renglon que hay que tipear en el celular salia
  // cortado por los dos lados. Se parte en dos, y partirlo hace crecer el
  // bloque: el reparto de la pantalla CONNECT PHONE tiene que contar con eso.
  //
  // Dos: GAME OVER ponia cada cosa en una fila fija de la rejilla, y eso solo
  // cerraba con las 144 filas de la consola. Con el piso de filas (§21.2) la
  // pantalla baja a 104 y el cuadro de opciones caia encima de la franja de
  // controles: PLAY AGAIN salia escrito sobre BRAKE.
  //
  // Tres: el menu tiene una opcion mas y ya no lleva el codigo debajo.
  //
  // No se recalculan las formulas aca —seria copiarlas y se desincronizarian—:
  // se mira Menu.layout, que es el reparto que cada dibujo publica de verdad.
  const HELP_H = 4 + 7;                    // la ayuda de navegacion: 4 de aire + un renglon
  for (const [w, h] of [[768, 576], [1024, 576], [1920, 1080], [1366, 768], [1280, 576], [2560, 1080]]) {
    const p = await (await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true })).newPage();
    p.on('pageerror', e => { if (!KNOWN_NOISE(e)) errors.push(`${w}x${h}: ${e}`); });
    await p.goto(`${base}/index.html`, { waitUntil: 'load' });
    await p.waitForTimeout(300);
    const r = await p.evaluate(async () => {
      Link.url = () => 'https://elpatopotato.github.io/myspacedrift/?ctrl';
      const st = Link.status(); st.code = Link.code(); st.error = ''; st.linked = false;
      quitAttract();                       // con la demo puesta el menu no dibuja el cuadro quieto
      const drawn = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); };

      await drawn();
      // el hit-test llama tintBox() sin argumento; el dibujo le pasa su escala
      const menu = { ...Menu.layout, rows: Menu.rows.length,
                     tintHit: tintBox().w, tintDrawn: tintBox(Menu.layout.ts).w };

      screen = SCREEN.LINK;
      await drawn();
      const link = { ...Menu.layout, rowsShown: Menu.rows.join('|'),
                     widest: Math.max(...linkRows(LW - 2 * T).map(s => Font.width(s, 1))) };

      hs.pending = false;
      screen = SCREEN.DEAD;
      await drawn();
      const dead = { ...Menu.layout, rows: Menu.rows.length };

      screen = SCREEN.MENU;
      return { menu, link, dead, LW, LH: LH(), room: LW - 2 * T };
    });
    const at = `${w}x${h}`, size = `LCD ${r.LW}x${r.LH}`;

    // ---- menu ----
    check(`${at}: el menu ofrece las cuatro opciones`, r.menu.rows === 4, `${r.menu.rows} filas`);
    check(`${at}: el cuadro del menu no le trepa al titulo`, r.menu.boxTop >= r.menu.titleEnd,
          `cuadro en ${r.menu.boxTop}, titulo hasta ${r.menu.titleEnd} (${size})`);
    check(`${at}: el cuadro del menu no pisa la franja`,
          r.menu.boxTop + r.menu.boxH + (r.menu.help ? HELP_H : 0) <= r.menu.hintsY,
          `cuadro hasta ${r.menu.boxTop + r.menu.boxH}, franja en ${r.menu.hintsY}`);
    // el easter egg se toca sobre el titulo: la zona del hit-test tiene que
    // medir lo mismo que la que se dibujo, o se toca donde no hay nada
    check(`${at}: el area del tinte coincide con el titulo dibujado`,
          r.menu.tintHit === r.menu.tintDrawn, `hit ${r.menu.tintHit} vs dibujo ${r.menu.tintDrawn}`);

    // ---- pantalla del mando ----
    check(`${at}: la direccion no se corta`, r.link.widest <= r.room,
          `${r.link.widest} de ${r.room} (${r.link.rows} renglon/es, ${size})`);
    check(`${at}: el codigo no pisa el cuadro`, r.link.codeEnd <= r.link.boxTop - 2,
          `codigo hasta ${r.link.codeEnd}, cuadro en ${r.link.boxTop}`);
    check(`${at}: el cuadro del mando no pisa la franja`,
          r.link.boxTop + r.link.boxH <= r.link.hintsY, `cuadro hasta ${r.link.boxTop + r.link.boxH}`);
    // el codigo es lo ultimo que cede: antes se achica el titulo
    check(`${at}: el codigo sigue leyendose de lejos`, r.link.cs >= 2,
          `escala ${r.link.cs} (titulo en ${r.link.ts}, ${size})`);
    check(`${at}: del mando se vuelve`, r.link.rowsShown === 'BACK', r.link.rowsShown);

    // ---- GAME OVER ----
    check(`${at}: las opciones de GAME OVER no pisan la franja`,
          r.dead.blockTop + r.dead.blockH + (r.dead.help ? HELP_H : 0) <= r.dead.hintsY,
          `cuadro hasta ${r.dead.blockTop + r.dead.blockH}, franja en ${r.dead.hintsY} (${size})`);
    check(`${at}: el nivel no se mete en las opciones`, r.dead.statsEnd <= r.dead.blockTop - 2,
          `texto hasta ${r.dead.statsEnd}, cuadro en ${r.dead.blockTop}`);
    check(`${at}: el marcador de GAME OVER sigue en grande`, r.dead.s === 2,
          `escala ${r.dead.s} (${size})`);
    await p.context().close();
  }
}

check('la pagina no lanzo errores', errors.length === 0, errors.join(' | '));

await browser.close();
server.close();
console.log(res.failed ? `\n${res.failed} fallo(s)\n` : '\ntodo correcto\n');
process.exit(res.failed ? 1 : 0);
