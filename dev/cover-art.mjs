/* La escena de la portada: el reparto y la funcion que la dibuja DENTRO de la
 * pagina. Vive aparte porque la usan dos capturas —la portada de itch.io
 * (capture-cover.mjs) y la etiqueta del cartucho (capture-cartridge.mjs)— y una
 * sola escena es lo que hace que las dos sean la misma imagen.
 *
 * Lo que motiva todo esto es lo mismo que motiva a capture-media.mjs: el juego
 * no se deja dibujar a mano. Es un LCD cuantizado a cuatro tonos, y cualquier
 * cosa hecha fuera —un montaje, un reescalado, una tipografia de verdad— le mete
 * medios tonos y bordes suaves que en el juego no existen. Una portada asi miente
 * sobre lo que se va a ver al apretar PLAY.
 *
 * Asi que la dibuja el juego con sus propias piezas: la nave sale de SHIP_SEGS
 * con sus motores, las rocas de makeRock, las mitades de splitMeteor, el escudo
 * de drawPickup, el cielo de Stars, las letras de Font, y los cuatro tonos y la
 * reticula del shader LCD. Aca no se pinta nada: se arma la escena, se la deja
 * correr unos cuadros para que quede la estela, y se aprieta el obturador.
 *
 * Dos numeros mandan sobre el resto:
 *
 *   - 126 x 100 puntos por 5 pixeles de lado son 630 x 500 exactos, que es la
 *     medida que muestra la ficha de itch.io. El punto cae entero: sin eso la
 *     reticula cojea (unas celdas de 3 pixeles y otras de 4) y la imagen se ve
 *     sucia justo en lo que la hace reconocible.
 *
 *   - El juego dibuja a 0.3 puntos por unidad de mundo (144 filas sobre las 480
 *     de alto que mide el mundo) y ahi la nave son ocho puntos. En la miniatura
 *     de la tienda eso es una mota. La portada mira el mismo campo mas de cerca
 *     —0.8— y la nave pasa a veintidos puntos: la misma nave, el mismo trazo de
 *     un punto, la misma fisica; solo cambia a que distancia se la mira.
 *
 * La escena no es un cuadro robado a una partida: en una partida la nave esta
 * donde esta, y una portada necesita el nombre con su sitio y la nave apuntando
 * hacia adentro. Se colocan las piezas a mano, en puntos de LCD (LAYOUT.scene),
 * y se las deja moverse: lo que se ve es el juego, puesto.
 *
 * Sale siempre igual: el azar va sembrado y el reloj de las estrellas, clavado.
 */

export const LAYOUT = {
  cols: 126, rows: 100, cell: 5,   // 126*5 = 630, 100*5 = 500
  pixel: 0.8,                      // puntos de LCD por unidad de mundo
  seed: 20250818,
  tint: 'MONO',                    // el vidrio: MONO es el juego sin tenir, como el icono

  // El titulo va en dos renglones a escala 2: 'MY SPACE DRIFT' de una sola tira
  // mide 167 puntos y no entra en 126, y a escala 1 entra pero en la miniatura
  // de la tienda queda en tres pixeles por letra. Partido, el nombre se lee de
  // lejos, que es lo unico que una portada tiene que resolver.
  title: [['MY SPACE', 6], ['DRIFT', 22]],
  rule: 39,                        // la raya del menu, debajo del titulo

  // Todo lo de abajo en puntos de LCD; el script lo pasa a unidades de mundo.
  // El reparto es de dos pisos: el nombre se queda con la mitad de arriba y el
  // campo entero con la de abajo. Repartir texto arriba Y abajo dejaba el juego
  // en una franja del medio, y ahi la nave volvia a ser una mota, que es lo que
  // esta portada tiene que evitar.
  scene: {
    // 'spin' es el giro de la nave, en rad/s. No es adorno: la bala sale girando
    // como en el juego —el piso lo pone la velocidad, y encima puede ganarle el
    // giro propio de la nave (§7.1)—, asi que la raya del disparo tumbea en vez
    // de salir clavada. Con un motor encendido la nave esta girando de verdad.
    ship:    { x: 26, y: 74, a: -0.25, speed: 150, spin: 1.6, right: true },
    rocks: [
      { x: 112, y: 86, r: 16, dir: 2.6, spd: 70 },
      // la del final de la linea de tiro: entera, con la bala encima. Es lo que
      // cuenta el juego en una imagen quieta —nave, disparo y roca— y por eso la
      // roca que se parte no va aca sino lejos, de adorno
      { x: 97, y: 61, r: 13, dir: 3.0, spd: 75 },
      { x: 120, y: 55, r: 5, dir: 3.4, spd: 80 },
      { x: 100, y: 97, r: 6, dir: 4.2, spd: 125 },
      // las dos de las esquinas de arriba: el cielo solo, al lado del nombre,
      // queda vacio, y el campo tiene que llegar hasta el borde de la portada
      { x: 5, y: 13, r: 4, dir: 1.1, spd: 120 },
      { x: 121, y: 21, r: 5, dir: 2.2, spd: 130 },
    ],
    // Una roca partiendose, abajo a la izquierda. No es un efecto aparte: la
    // parte splitMeteor, o sea lo mismo que pasa cuando una bala la parte en la
    // partida — las dos mitades son la roca cortada por el medio, con los mismos
    // vertices, abriendose en abanico, y el 20% que no se lleva ninguna se va en
    // polvo por la linea del corte. 'age' es el reloj que se le adelanta para
    // que las mitades ya se hayan separado.
    split:   { x: 18, y: 53, r: 10, dir: 4.9, spd: 85, age: 0.18 },
    // Puntos de LCD por delante del morro. Va una sola y va lejos, y las dos
    // cosas por el mismo motivo: la estela de la bala mide lo que la bala haya
    // volado mientras el fantasma no se apaga (unos 25 puntos a este zoom). Mas
    // cerca del morro la estela toca la nave y las dos se leen como una lanza;
    // dos balas seguidas se pegan entre si y se leen como un laser, que este
    // juego no tiene. A 45 puntos la raya sale suelta, que es lo que es.
    bullets: [46],
    pickup:  { x: 58, y: 90 },
  },
};

/* El bucle del juego se para antes de tocar nada: si siguiera corriendo,
 * borraria la escena en el cuadro siguiente. Va suelta porque page.evaluate
 * serializa la funcion: no puede mirar nada de este modulo. */
export function stopLoop() {
  Sfx.quiet = true;
  window.requestAnimationFrame = () => 0;
}

/* Se ejecuta DENTRO de la pagina, con el juego ya cargado. Solo mira su
 * argumento y los globales del juego, que es lo unico que sobrevive al viaje. */
export function compose(C) {
  /* ---------- azar y reloj quietos: la imagen sale igual todas las veces ---------- */
  let s0 = C.seed >>> 0;
  Math.random = () => {                     // mulberry32
    s0 = (s0 + 0x6D2B79F5) >>> 0;
    let t = s0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  performance.now = () => 8000;             // el titileo del cielo, congelado

  /* ---------- la pantalla, con el punto entero ---------- */
  PIX = C.pixel;
  H = C.rows / C.pixel;
  W = C.cols / C.pixel;
  for (const c of [scene, trail]) { c.width = C.cols; c.height = C.rows; }
  ctx.imageSmoothingEnabled = false;
  tctx.setTransform(1, 0, 0, 1, 0, 0);
  VRAM.resize(C.cols, C.rows);
  VRAM.clear();
  Stars.reset(C.cols, C.rows);
  cv.width = C.cols * C.cell; cv.height = C.rows * C.cell;
  cv.style.width = cv.width + 'px'; cv.style.height = cv.height + 'px';
  Tint.set(C.tint || 'MONO');               // el vidrio, que es lo unico que da color
  LCD.resize();

  /* ---------- la escena, en unidades de mundo ---------- */
  const u = (v) => v / C.pixel;             // punto de LCD -> unidad de mundo
  const S = C.scene;

  G.meteors = []; G.bullets = []; G.shards = []; G.rings = []; G.pickups = [];
  G.entry = false; G.ready = 0; G.attract = false; G.flash = 0;
  G.score = 0; G.level = 1;
  G.nextLevelAt = Infinity;                 // partir cobra puntos, y un nivel nuevo vacia el campo

  const ship = newShip(u(S.ship.x), u(S.ship.y), S.ship.a);
  ship.vx = Math.cos(S.ship.a) * S.ship.speed;
  ship.vy = Math.sin(S.ship.a) * S.ship.speed;
  ship.av = S.ship.spin || 0;               // esta girando: el motor de un lado esta encendido
  ship.right = !!S.ship.right;
  G.ship = ship;

  for (const r of S.rocks) {
    G.meteors.push({
      x: u(r.x), y: u(r.y), vx: Math.cos(r.dir) * r.spd, vy: Math.sin(r.dir) * r.spd,
      a: Math.random() * TAU, va: rnd(-CFG.meteorRotMax, CFG.meteorRotMax),
      pts: makeRock(u(r.r)), r: u(r.r), splits: 0,
    });
  }

  // La bala es la del juego, con la misma cuenta de updatePlay: nace en el morro,
  // hereda la velocidad de la nave, y el giro sale del piso que pone esa
  // velocidad o del giro propio de la nave, el que gane (§7.1).
  const sp = Math.hypot(ship.vx, ship.vy);
  const spinFloor = CFG.bulletSpinMin +
    (CFG.bulletSpinMax - CFG.bulletSpinMin) * clamp(sp / CFG.shipMaxSpeed, 0, 1);
  const spin = Math.max(spinFloor, Math.abs(ship.av) * CFG.bulletSpinKick);
  const nose = CFG.shipLen / 2;
  for (const d of S.bullets) {
    const bvx = ship.vx + Math.cos(ship.a) * CFG.bulletSpeed;
    const bvy = ship.vy + Math.sin(ship.a) * CFG.bulletSpeed;
    G.bullets.push({
      x: ship.x + Math.cos(ship.a) * (nose + u(d)), y: ship.y + Math.sin(ship.a) * (nose + u(d)),
      vx: bvx, vy: bvy, a: ship.a,
      av: spin * (ship.av < 0 ? -1 : 1),    // gira hacia donde giraba la nave
      len: Math.hypot(bvx, bvy) * CFG.bulletStreak,
      life: CFG.bulletLife, max: CFG.bulletLife,
    });
  }

  /* ---------- la roca que se parte: la parte el juego ---------- */
  const b = S.split;
  const bx = u(b.x), by = u(b.y);
  G.meteors.push({
    x: bx, y: by, vx: Math.cos(b.dir) * b.spd, vy: Math.sin(b.dir) * b.spd,
    a: Math.random() * TAU, va: rnd(-CFG.meteorRotMax, CFG.meteorRotMax),
    pts: makeRock(u(b.r)), r: u(b.r), splits: 0,
  });
  const before = G.meteors.length - 1;
  splitMeteor(before, CFG.bulletSpeed);
  const halves = G.meteors.slice(before);   // las dos mitades quedan al final
  // El anillo del impacto se queda fuera: en el juego dura 0.28 s y crece a 130
  // por segundo, o sea que en los pocos cuadros que se graban aca ya se abre
  // media portada, y con la estela detras deja una banda gris de cinco puntos de
  // grosor. A este zoom no se lee como un golpe, se lee como una luna.
  G.rings.length = 0;

  // Recien partida, la roca todavia ES la roca: las mitades estan pegadas. Se le
  // adelanta el reloj para que se hayan abierto, y despues se corre el conjunto
  // hasta donde lo puso el reparto — si no, el corte deriva y la roca aparece
  // donde la llevo su propia velocidad y no donde tiene que estar.
  const moved = [...halves, ...G.shards];
  for (const o of moved) { o.x += o.vx * b.age; o.y += o.vy * b.age; o.a += o.va * b.age; }
  for (const d of G.shards) d.life -= b.age;
  let cx = 0, cy = 0;
  for (const h of halves) { cx += h.x / halves.length; cy += h.y / halves.length; }
  for (const o of moved) { o.x += bx - cx; o.y += by - cy; }

  G.pickups.push({ x: u(S.pickup.x), y: u(S.pickup.y), vx: 0, vy: 0,
                   t: 1.35, r: 13 * CFG.pickupScale, kind: 'shield' });

  /* ---------- unos cuadros de vuelo: la estela es la mitad del LCD ---------- */
  // Sin esto la escena queda congelada y sin fantasmas, que es justo lo que
  // distingue a esta pantalla de un dibujo. Se rebobina lo que se va a andar,
  // asi cada pieza termina exactamente donde la puso el reparto de arriba.
  //
  // El paso es un cuadro del hardware —el fantasma tiene generaciones y el
  // motor de la nave se sortea entero en cada llamada (drawShip -> rnd), asi que
  // partir el cuadro en tres no acorta la estela: dibuja el triple de llamas
  // distintas superpuestas y la popa se vuelve una mancha—, pero corrido por el
  // zoom.
  //
  // Ese corrimiento es lo que hace que la portada se parezca a jugar. La estela
  // se apaga por tiempo, o sea que mide lo que la pieza HAYA VOLADO en esos tres
  // cuadros: en unidades de mundo siempre lo mismo, pero en puntos de LCD, el
  // doble y medio aca que en la pantalla real, porque aca el punto es dos veces
  // y media mas grande. Con el reloj sin corregir la bala arrastraba una raya de
  // veinticinco puntos —un laser— y la nave, una mancha. Corriendo el paso por
  // 0.3/pixel, cada pieza deja el mismo rastro EN PANTALLA que deja jugando.
  const DT = (1 / 60) * (CFG.lcdRows / CFG.baseHeight) / C.pixel;
  const STEPS = 4;
  const step = (dt) => {
    for (const m of G.meteors) { m.x += m.vx * dt; m.y += m.vy * dt; m.a += m.va * dt; }
    for (const bl of G.bullets) { bl.x += bl.vx * dt; bl.y += bl.vy * dt; bl.a += bl.av * dt; bl.life -= dt; }
    for (const d of G.shards) { d.x += d.vx * dt; d.y += d.vy * dt; d.a += d.va * dt; d.life -= dt; }
    for (const p of G.pickups) { p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt; }
    G.ship.x += G.ship.vx * dt; G.ship.y += G.ship.vy * dt; G.ship.a += G.ship.av * dt;
  };
  for (let i = 0; i < STEPS; i++) step(-DT);
  for (let i = 0; i < STEPS; i++) { step(DT); renderWorld(DT); }

  /* ---------- el mismo volcado que hace frame() ---------- */
  ctx.setTransform(PIX, 0, 0, PIX, 0, 0);
  ctx.fillStyle = CFG.bg;
  ctx.fillRect(0, 0, W, H);
  Stars.draw();                             // ultimo: VRAM mezcla por maximo, no tapa nada
  VRAM.blit(1, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(trail, 0, 0);

  /* ---------- el nombre, con la fuente del juego ---------- */
  uiBegin();
  const mid = C.cols / 2;
  for (const [line, y] of C.title) text(line, mid, y, 2, 'center', 3);
  const tw = Font.width(C.title[0][0], 2);
  ctx.fillStyle = TONE[2];                  // la raya del menu, gris claro
  ctx.fillRect(Math.round(mid - tw / 2), C.rule, tw, 1);
  uiEnd();

  LCD.present();
  return {
    cols: scene.width, rows: scene.height, cw: cv.width, ch: cv.height, gl: LCD.ok,
    url: C.dataUrl ? cv.toDataURL('image/png') : '',
  };
}

/* Las dos comprobaciones que valen la pena: sin WebGL no hay ni paleta ni
 * reticula (el juego cae a un camino de respaldo que sirve para jugar pero no
 * para una imagen), y si la rejilla no sale clavada el punto deja de ser entero. */
export function check(shot, C) {
  if (!shot.gl) return 'sin WebGL no hay paleta ni reticula: la imagen saldria cruda';
  if (shot.cols !== C.cols || shot.rows !== C.rows)
    return `la rejilla salio ${shot.cols}x${shot.rows} y no ${C.cols}x${C.rows}`;
  return '';
}
