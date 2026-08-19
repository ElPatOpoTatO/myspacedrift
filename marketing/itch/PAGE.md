# Ficha de itch.io — My Space Drift

Lo de abajo va **literal** en la ficha. Es a propósito corto: un TL;DR y la base del
juego, nada más. Los detalles —cómo está hecho el LCD, la partición de las rocas, el
tinte, el enlace con el celular por WebRTC— no van acá: quien los quiera los
encuentra en el README, y en una ficha compiten con lo único que hay que entender
antes de apretar PLAY.

Va en inglés, como el juego y como `marketing/reddit/`.

---

## Title

```
My Space Drift
```

## Short description / tagline

El campo corto de itch (sale en las tarjetas y en los embeds). Ciento y pico de
caracteres es el tope; este mide 68.

```
A two-thruster arcade game. The engine never stops — you only steer.
```

## Description

El cuerpo de la página. Todo lo que sigue, tal cual.

```
**You only steer.**

No accelerator, no fire button. The engine runs the whole time and all you get is a
left thruster and a right thruster. Holding both slows you down, but only to half
speed, so you can never quite stop. Any thruster also fires, so you aim by turning.

Two hits ends a run. A run lasts about half a minute.

**Controls**

- Left / Right arrows, or A / D — the two thrusters
- Space — both at once, which is the brake
- Touchscreen — the left half and the right half of the screen

Menus use the same two inputs: one side moves, both together selects. There is no
third button anywhere in the game.

Free, runs in the browser, nothing to install.
```

## Si querés una línea más

El emparejamiento con el celular es lo más llamativo que tiene el juego, pero
también lo que más se puede romper en la ficha (ver la nota de abajo). Si el enlace
ya funciona desde donde esté publicado, esta línea va al final del cuerpo:

```
Two devices, if you have them: open it on a TV or laptop, put `?ctrl` on the end of
the same address on your phone, type the six-digit code on screen, and the phone is
the pad.
```

---

## Campos de la ficha

Esto no es texto: son las casillas de itch, y en un juego web hay tres que si se
dejan mal no se juega.

| campo | valor |
| --- | --- |
| Kind of project | HTML |
| Uploads | el zip de `butler` marcado **This file will be played in the browser** |
| Embed | 768 × 576, *Click to launch in fullscreen*, **Mobile friendly** activado |
| Genre | Action |
| Tags | `arcade`, `asteroids`, `game-boy`, `retro`, `pixel-art`, `one-button`, `high-score`, `html5` |
| Release status | Prototype / In development |
| Pricing | Free |

768 × 576 no es una medida elegida por estética: es la única que le da al juego las
144 filas enteras **y** el punto en píxeles enteros. El tamaño del punto sale del eje
que apriete —`PIX = min(lcdRows/H, max(lcdCols/W, lcdRowsMin/H))`— y en una ventana
ancha manda el tope de columnas, así que el alto del LCD se desploma:

| ventana | LCD que queda | el punto mide |
| --- | --- | --- |
| **768 × 576** (4:3) | **192 × 144** | **4 × 4 px exactos** |
| 800 × 600 (4:3) | 192 × 144 | 4,167 px — la retícula cojea |
| 1024 × 576 (16:9) | 200 × 113 | 5,12 × 5,097 px — cojea, y faltan 31 filas |

Las 144 filas son las de la Game Boy y son las que hacen que el menú entre entero con
su línea de ayuda; en 16:9 esa línea es lo primero que el reparto sacrifica (por eso
`shot-tint.png` va en 4:3). Y 4 píxeles por punto es la misma medida con la que se
sacan las capturas, así que lo que se ve en la ficha es lo que se ve en las fotos.

> `marketing/itch-io.md` dice 800 × 600. Da las mismas 192 × 144 filas, así que no
> está mal; 768 × 576 sólo agrega que el punto caiga entero.

## Antes de publicar: la dirección del mando

El menú publica `location.origin + location.pathname + '?ctrl'`, o sea la dirección
desde la que se esté sirviendo el juego. En GitHub Pages eso es
`elpatopotato.github.io/myspacedrift/?ctrl`, que se puede teclear en un celular.
**En itch.io el juego corre dentro de un iframe servido desde un dominio de CDN**
(algo como `v6p9d9t4.ssl.hwcdn.net/html/1234567/index.html`), así que el renglón que
hay que teclear en el teléfono sale ilegible y el emparejamiento, en la práctica, no
se puede usar desde la ficha.

Hay dos salidas, y las dos son decisión de quien publica:

1. Dejarlo así y **no** poner la línea del celular en la descripción.
2. Que el juego anuncie siempre la dirección pública en vez de la suya. Es una
   línea en `Link.url()` de `index.html` (y subir el número de `CACHE` en `sw.js`).
