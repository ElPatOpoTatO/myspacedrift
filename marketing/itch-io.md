# Página de itch.io — My Space Drift

Gratis, sin barrera de karma ni de reputación, y le da al juego un sitio propio al que apuntar desde
todo lo demás. Hacé esta aunque no hagas ninguna otra: cualquier post posterior mejora cuando el
enlace lleva a una página de verdad y no a una URL pelada.

---

## 1. El zip

```sh
zip -j -X myspacedrift.zip index.html sw.js manifest.webmanifest \
  icon-180.png icon-192.png icon-512.png icon-maskable-512.png
```

El `-j` es lo importante: mete los archivos sin carpeta. **`index.html` tiene que quedar en la raíz
del zip**, no dentro de un directorio — es el error que más se repite al subir HTML5.

Son siete archivos y unos 150 KB. Los límites de itch son 1000 archivos, 500 MB en total, 200 MB por
archivo y rutas de hasta 240 caracteres, así que no hay nada de qué preocuparse. No incluyas `dev/`,
`tools/`, `media/` ni `marketing/`.

---

## 2. Los campos, en el orden del formulario

| Campo | Qué poner |
|---|---|
| **Title** | `My Space Drift` |
| **Project URL** | Se genera solo desde el título; dejalo en `my-space-drift` |
| **Short description or tagline** | ver abajo |
| **Classification** | `Games` |
| **Kind of project** | `HTML` |
| **Release status** | `In development` — es lo honesto, y baja la vara con la que lo miran |
| **Pricing** | `No payments`, o `$0 or donate` si querés dejar la puerta abierta |
| **Uploads** | El zip, y **tildar "This file will be played in the browser"** |
| **Embed options** | ver §3 |
| **Description** | ver §5 |
| **Genre** | `Action` |
| **Tags** | máximo 10, ver §4 |
| **App store links** | vacío |
| **Custom noun** | vacío |
| **Community** | `Comments` — sin esto no hay dónde te dejen la opinión, que es el motivo de publicarlo |
| **Visibility & access** | Arranca en `Draft`. Pasalo a `Public` recién cuando lo probaste jugado desde la propia página |

---

## 3. Los ajustes del embed

Aparecen al marcar el upload como jugable en el navegador.

- **Display mode:** `Embed in page`
- **Viewport dimensions:** **800 × 600**
- **Fullscreen button:** sí
- **Mobile friendly:** sí
- **Click to play:** sí — evita que el audio arranque solo, que en itch queda mal
- **Scrollbars:** no

**Por qué 4:3 y no 16:9.** No es estético, es cuántas filas de LCD quedan. Con el tope de columnas
(`CFG.lcdCols`) y el piso de filas (`CFG.lcdRowsMin`), el tamaño del punto sale del eje que apriete:

| Relación de la ventana | LCD que queda |
|---|---|
| hasta 1.389 (4:3 = 1.333) | **192 × 144** — las 144 filas enteras |
| entre 1.389 y 1.923 | 200 de ancho, entre 144 y 104 filas |
| 1.923 en adelante | 104 filas, que es el piso |

O sea que 800×600 da el LCD completo de 144 filas, que además es lo más parecido al aparato real
(160×144), y con esas filas el menú entra entero y muestra la línea de ayuda de navegación. En 16:9
el LCD queda en 200×113 y esa línea es lo primero que el reparto sacrifica.

---

## 4. Título, tagline y etiquetas

**Title:** `My Space Drift`

**Tagline:**

> Two thrusters, no accelerator, no fire button. The engine never stops and you can never quite stop
> either.

**Tags** (el máximo son 10, en minúscula, sin pasarse — itch posiciona peor las páginas mal
etiquetadas):

`arcade`, `gameboy`, `retro`, `pixel-art`, `space`, `singleplayer`, `html5`, `score-attack`,
`asteroids`, `minimalist`

**More information** (la metadata de más abajo):

- **Average session:** `A few minutes`
- **Languages:** `English`
- **Inputs:** `Keyboard`, `Touchscreen`

---

## 5. Descripción de la página

> You get a left thruster and a right thruster. That's the whole control scheme.
>
> There's no accelerator, because the engine never switches off. There's no fire button, because any
> thruster fires. Holding both slows you down but only to half speed, so stopping isn't something
> the game lets you do. Aiming happens by turning, which means you can't line up a shot without also
> going somewhere.
>
> Two hits ends a run. There's no lives counter — after the first hit the ship starts losing pieces
> of its own outline, and that's the only warning you get.
>
> **Your phone can be the controller.** Open the game on a laptop or TV and it shows a six-digit
> code. Open the same page on your phone with `?ctrl` on the end, type the code in, and the phone
> becomes the two-button pad. It runs over WebRTC, so both devices need internet but not the same
> wifi.
>
> **The Game Boy look isn't a filter.** The scene is rasterized by hand into a buffer 144 rows tall
> and quantized to four tones, because canvas antialiasing would put half-tones on every edge and
> that screen didn't have any. The frame rate is pinned to 59.7275 Hz, which is what the original
> ran at. The sound is square waves only, synthesized in the browser, with no recorded files at all.
>
> It's unfinished and I'd like to know what you'd add, remove or change.
>
> ---
>
> **Controls**
>
> - Keyboard: `←` / `→` or `A` / `D` for the two thrusters, `Space` for both at once (the brake)
> - Touch: left half of the screen, right half of the screen, or both
> - Menus use the same two inputs — one side moves, both together selects
>
> There's an easter egg on the menu.
>
> Source: https://github.com/ElPatOpoTatO/myspacedrift — one HTML file, no build step.

---

## 6. Imágenes

- **Cover image:** `media/cover-630x500.png`. itch pide 630 × 500; el mínimo es 315 × 250 con
  relación 315:250.
- **Screenshots:** entre 3 y 5. Poné `media/gameplay.gif` primero — los GIF animados valen como
  screenshot y es lo que más muestra —, después `shot-play.png`, `shot-menu.png` y `shot-scores.png`.

---

## 7. Dos cosas que van a aparecer y no son fallos

**El service worker.** itch sirve los HTML5 en un iframe de otro subdominio, así que puede no
registrarse ahí. Lo único que se pierde es jugar sin conexión, que es todo lo que hace `sw.js`. El
emparejamiento con el móvil y la tabla de récords en `localStorage` funcionan igual, y la versión de
GitHub Pages sigue andando sin conexión como siempre.

**La declaración de IA.** itch pregunta si el contenido usa IA generativa, y conviene decidirlo a
conciencia: los gráficos y el sonido **no** son generados por IA — se dibujan y se sintetizan por
código, y los iconos salen de `tools/make-icons.py` a partir de la geometría de la nave —, pero el
código sí se escribió con ayuda de IA. El campo pregunta por los *assets*, no por el código.

---

## 8. Que se actualice solo, después

Se puede, con [butler](https://itch.io/docs/butler/), la herramienta oficial de itch, enganchada a
GitHub Actions para que publique en cada push a `main`.

**El orden importa:** butler sube builds a un proyecto que ya existe — no crea la página ni rellena
ningún campo. Así que la página se crea a mano una vez, con todo lo de arriba, y recién después se
automatiza.

Lo que hace falta:

1. Una API key en `itch.io/user/settings/api-keys`.
2. Pegarla en el repo, en Settings → Secrets and variables → Actions, como `BUTLER_API_KEY`.
3. Un workflow que arme el zip y corra `butler push <dir> elpatopotato/my-space-drift:html5`.

Las dos primeras se hacen desde el teléfono sin problema. El workflow sube el build y nada más: los
ajustes de la página —el tilde de "jugable en el navegador", el viewport de 800×600— se ponen una vez
y quedan.

Vale la pena, porque el juego es un archivo que se toca seguido y sin esto cada cambio significa
rehacer el zip y volver a subirlo a mano.

---

## 9. Cuando ya esté arriba

- Poné el enlace de itch en la descripción del repo en GitHub y en el README.
- Usá la página de itch como enlace en los posts de Reddit: lleva capturas y descripción, que una URL
  de GitHub Pages no tiene.
- itch tiene sus propios foros (Release Announcements, y los tableros de feedback). Publicar ahí es
  gratis y sin barrera, y es el paso natural una vez que la página existe.
