# Posts de Reddit — My Space Drift

Cada post va con tres cajas: **título**, **media** y **cuerpo**. Se copian sueltas:
el título al campo de título, la media es la receta de lo que hay que grabar o
capturar antes de subirlo, y el cuerpo al comentario o al texto del post.

Enlace del juego, el mismo en todos:

```
https://elpatopotato.github.io/myspacedrift/
```

Reglas de la casa, para no comerse un baneo:

- Un post por subreddit, con días de por medio, no todos el mismo día.
- En los subs que no dejan enlaces en el post (r/WebGames, r/IndieGaming), el
  enlace va en el **primer comentario propio**, fijado si se puede.
- La media se sube **nativa** a Reddit (vídeo o imagen), nunca como enlace a
  YouTube: el alcance cae a la mitad.
- Los títulos van en el idioma del sub: inglés en los internacionales, castellano
  en los de habla hispana.

## Cómo capturar la media

Todo se graba de la pantalla grande, con el móvil ya emparejado y jugando de
verdad — nada de mover con teclado para que quede "limpio", porque la deriva se
nota.

```
Resolución de captura : 1920x1080 (el LCD se escala solo, sin filtros)
Formato vídeo         : MP4, H.264, 30 fps, sin audio salvo que se indique
Duración              : 15-40 s (Reddit corta la atención antes del minuto)
Formato imagen        : PNG, 1920x1080, sin marco ni bordes añadidos
Sin cursor en pantalla, sin barra del navegador (F11), sin overlay de grabación
```

---

## 1. r/WebGames — el gancho principal

**Título**

```
Made an Asteroids-like that runs in the browser and uses your phone as the controller — no install, no app, no same-network requirement
```

**Media**

```
Vídeo, 30 s, sin audio. Dos tomas en una:
  0-8 s   plano del móvil sobre la mesa con la pantalla grande detrás:
          se escribe el código de 6 dígitos y el mando conecta
  8-30 s  pantalla completa del juego, partida real: girar con un dedo,
          frenar con los dos, partir un meteoro en dos mitades
Se graba con el móvil apoyado en el borde inferior del encuadre, para que se
vea qué dedo aprieta cada propulsor.
```

**Cuerpo**

```
It's a Game Boy-looking space game: four shades of grey, 160x144-ish LCD, ghost
trail, locked to the original 59.7275 Hz.

The part I like: the big screen shows a six-digit code, you open the same URL on
your phone and type it, and the phone becomes the controller. WebRTC, so the two
devices don't need to be on the same network — wifi, ethernet or mobile data,
just internet on both. The code survives a reload, so the phone reconnects on
its own when the TV comes back.

Controls are two thrusters and nothing else: left side of the phone, right side,
and both at once to brake. No buttons, no d-pad. Turning and braking share the
same pair, so you can't do both at once — that's the whole game.

It's a PWA, so after the first load it runs offline.

Link in the comments.
```

---

## 2. r/gamedev — el post técnico (la estela por tiempo)

**Título**

```
Fading a CRT/LCD ghost trail per frame instead of per second turns it into two loose copies of the sprite — here's what it looks like and how I fixed it
```

**Media**

```
Imagen, comparación lado a lado, 1920x1080, PNG.
Izquierda  : rótulo "per frame @ 30 fps" — misma roca cruzando, la estela
             separada en tres copias sueltas
Derecha    : rótulo "per second" — la misma roca, la estela pegada
Se saca poniendo CFG.trailFade por cuadro y limitando el bucle a 30 fps desde
las devtools; las dos capturas con la roca en la misma posición.
```

**Cuerpo**

```
The Game Boy LCD was slow to turn off, so everything that moved left a trail.
I fake it with an intensity buffer that dims a bit every frame, and since the
scene is quantised to four shades you get exactly three ghost generations behind
each rock before it goes dark.

The bug: I was dimming per frame. On a device that stutters, the rock jumps two
or three times further between frames while the ghost still lasts three frames —
so the trail stretches, the generations stop touching, and what you see isn't a
trail, it's two detached copies of the rock next to the rock.

Fix is one line conceptually: measure the fade in real time instead of in frames.
A long frame dims proportionally more, and the trail is the same length at 30,
60 or 144 fps. I kept the knob expressed per 60 Hz frame because that's the unit
you tune by eye, and convert at use.

Same class of bug as tying anything else to frame count. Posting it because the
symptom doesn't look like a timing bug at all — it looks like a rendering bug.

Whole game is one index.html file if anyone wants to read it.
```

---

## 3. r/IndieDev / r/indiegames — el clip de la entrada de la nave

**Título**

```
Every run starts with the ship flying itself in from off-screen — it's not an animation, it's an autopilot with the same two thrusters the player gets
```

**Media**

```
Vídeo, 18 s, sin audio. Tres entradas seguidas y distintas, cortadas seco:
  entrada 1 : desde el borde de arriba, morro al revés, corrige mientras acelera
  entrada 2 : desde un costado, cruce largo
  entrada 3 : desde abajo, corta
En las tres se tiene que ver la nave en gris, la escuadra del centro cerrándose,
y el parpadeo de medio segundo al llegar. Cortar justo cuando entran las rocas.
```

**Cuerpo**

```
The ship is born still, off-screen, on a random edge with a random heading, and
drives itself to the centre. When it arrives, control passes to the player.

No separate animation and no scripted path: it's the ship flying with the normal
physics — same cruise thrust, same turn inertia, same drift, same brake — driven
by an autopilot that only has the two thrusters the player has. The random
heading is what makes every entrance different, because the ship has to fix its
course while it's already accelerating.

It arrives in two stages, because braking and turning are the same pair of
thrusters and you can't do both: far away it crosses at full thrust, aiming
finer and finer as it closes in, and close up it fires both and comes in
straight, braking.

The "you're not driving yet" part is shown, not explained: the ship arrives in
grey instead of full white, there's a bracket in the centre closing as it gets
nearer, and on arrival the ship blinks for half a second — actually off, not
dimmed. That blink is the handover.

Playable in the browser, phone as controller. Link in the comments.
```

---

## 4. r/javascript o r/webdev — un solo archivo

**Título**

```
A whole Game Boy-style game in one index.html: 4-shade LCD, WebGL tint shader, synthesised audio, WebRTC phone controller, offline PWA
```

**Media**

```
Imagen, 1920x1080, PNG. Captura partida en dos:
  arriba  : el juego corriendo, con el tinte GREEN puesto
  abajo   : el árbol del repo — index.html, sw.js, manifest.webmanifest,
            los cuatro iconos — que caben en diez líneas
Se saca con `ls` en una terminal de fondo oscuro, o pegando el listado del repo.
```

**Cuerpo**

```
No build step, no bundler, no dependencies except PeerJS from a CDN for the
pairing. The repo is index.html, a service worker, a manifest and four icons.

What's inside:

- The scene renders to an intensity buffer, gets quantised to exactly four
  shades, and the tint is multiplied at the end in the shader — which is what
  the console's glass did. Eight tints, and adding a hue is adding a line.
- Every sound is synthesised in the browser at runtime. Nothing recorded, no
  audio files at all.
- The phone controller is WebRTC: the screen shows a six-digit code, the phone
  opens the same URL with ?ctrl and types it. Tries a direct connection first
  and falls back to a TURN relay when NAT blocks it, so both devices just need
  internet, not the same network.
- High scores are signed with HMAC-SHA-256 keyed off the pairing code, so
  editing localStorage from the inspector invalidates the whole table instead
  of accepting the made-up score. It stops hand-editing, not anyone who reads
  the source — the key ships in the HTML. A tamper-proof leaderboard needs a
  server.
- The frame rate is pinned to the hardware's 4194304/70224 = 59.7275 Hz,
  because on a 120 Hz phone it reads as smooth video instead of as the console.

Play: https://elpatopotato.github.io/myspacedrift/
Source: https://github.com/ElPatOpoTatO/myspacedrift
```

---

## 5. r/Gameboy o r/retrogaming — la fidelidad del panel

**Título**

```
Rebuilt the Game Boy's LCD in a browser: four shades, ghost trail, 59.7275 Hz, and the tinted glass as a shader pass
```

**Media**

```
Vídeo, 20 s, sin audio, un solo plano fijo del juego jugando.
Mientras corre, se cicla el tinte tocando el título: MONO, GREEN, AMBER, RED,
MAGENTA, VIOLET, BLUE, CYAN — como dos segundos y medio en cada uno.
La partida no se pausa: importa que se vea la estela moviéndose bajo cada vidrio.
```

**Cuerpo**

```
160x144 was the panel, but a browser canvas fills whatever screen it's on, and
those come in 16:9, 16:10 and 21:9. So the dot size has a ceiling and a floor
instead of being fixed: rows never above 144, columns never above 200, and rows
never below 104 (which is where the UI stops fitting). Past the ceiling the dot
gets bigger rather than multiplying.

Without the column ceiling the width was at the mercy of the aspect ratio — 256
dots on a TV, 312 on a phone, 368 with the browser bar — over twice the console,
and it looked thin instead of pixelated.

The trail is the panel being slow to turn off: an intensity buffer that dims
every frame, so each rock leaves three generations behind it, white to light
grey to dark grey. The stars are one LCD pixel each and never reach full white,
which is the colour the game draws with.

The tint isn't a set of palettes. The scene is quantised to the same four shades
and the colour is multiplied at the very end, the way the glass did it. There
are still exactly four shades on screen, tinted.

Free, runs in the browser, phone as controller.
```

---

## 6. r/programacion o r/gamedev_es — versión en castellano

**Título**

```
Hice un juego con pinta de Game Boy que se juega en la tele y se controla con el móvil, sin instalar nada, y cabe en un solo index.html
```

**Media**

```
La misma media del post 1 (vídeo de 30 s: emparejar el mando + partida real),
o la del post 4 si el sub es más de código que de juegos.
```

**Cuerpo**

```
La pantalla grande muestra un código de seis dígitos, abrís la misma URL en el
móvil, escribís el código y el móvil pasa a ser el mando. Va por WebRTC, así que
no hace falta que estén en la misma red: con que los dos tengan internet alcanza,
y si el NAT no deja pasar la vía directa sale por un TURN de relevo.

El mando son dos propulsores y nada más: mitad izquierda, mitad derecha, y las
dos a la vez para frenar. Girar y frenar son el mismo par, así que no se pueden
hacer las dos cosas a la vez — de ahí sale todo el juego.

Del lado técnico, sin build ni dependencias salvo PeerJS para el emparejamiento:
la escena se cuantiza a cuatro tonos, el tinte del vidrio se multiplica al final
en el shader, los sonidos se sintetizan en el navegador (nada grabado) y el top
10 se guarda firmado con HMAC-SHA-256 con clave derivada del código, así que
editar el localStorage a mano tira la tabla entera en vez de aceptar el puntaje
inventado.

Jugar: https://elpatopotato.github.io/myspacedrift/
Código: https://github.com/ElPatOpoTatO/myspacedrift
```

---

## Primer comentario, para los subs que no dejan enlaces

```
Play here (free, browser, no install): https://elpatopotato.github.io/myspacedrift/
Source (single index.html): https://github.com/ElPatOpoTatO/myspacedrift

You need two devices: a big screen for the game and a phone for the controller.
Open the link on the TV, open the same link on the phone, type the six digits.
```

## Orden sugerido

```
Semana 1  r/WebGames        el gancho, el que más alcance da
Semana 1  r/Gameboy         dos o tres días después, público distinto
Semana 2  r/gamedev         el post técnico de la estela
Semana 2  r/IndieDev        el clip de la entrada de la nave
Semana 3  r/javascript      el de un solo archivo
Semana 3  r/programacion    la versión en castellano
```
