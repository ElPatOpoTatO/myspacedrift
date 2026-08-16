---
name: lcd-audio
description: >-
  Diseñar, ajustar o añadir sonidos en My Space Drift. Úsala siempre que se toque el
  módulo Sfx de index.html, se pida crear, rediseñar o retocar un efecto de sonido,
  cambiar volúmenes o el motor de la nave, arreglar el mute, o cuando se hable de
  audio, SFX, bips, sonido, silencio, ruido o Web Audio en este juego.
---

# Audio LCD de My Space Drift

Todo el sonido del juego imita **un zumbador piezoeléctrico movido por ondas cuadradas**,
como el de una Game & Watch. No es una decoración: es la regla de la que se deducen todas
las demás. Antes de tocar una frecuencia, lee las reglas duras.

El módulo vive en `index.html`, bajo el banner `/* === audio (§13) === */`. Los números
ajustables están en `CFG` (sección `// --- audio (§13) ---`), nunca incrustados en el código.

---

## Reglas duras

| Regla | Por qué |
|---|---|
| **Solo `square`** | El piezo no reproduce otra forma de onda. Nada de `sine`, `sawtooth` ni `triangle`. |
| **Toda frecuencia sale de `TONES`** | La menor pentatónica, 440–2637 Hz. Cualquier par de notas de la tabla suena intencional; una frecuencia inventada suena a error. |
| **Nada por debajo de `CFG.volFloorHz` (380 Hz)** | El piezo no tiene graves — y el altavoz de un móvil tampoco. El juego es un PWA que se juega en el teléfono, así que la fidelidad histórica y la reproducción real piden lo mismo. `tone()` lo aplica como suelo duro, pero **no te apoyes en el clamp**: elige notas de `TONES`. |
| **Envolventes rectangulares** | `CFG.attack` 1,5 ms y `CFG.release` 4 ms, lo justo para no chasquear. El piezo está encendido o apagado; no se desvanece. Nada de colas exponenciales. |
| **Sin ruido blanco** | La Game & Watch no tenía generador de ruido. Sus explosiones eran saltos rápidos de tono: eso es `scramble()`. |
| **La dinámica va por duración, no por volumen** | El piezo no controla amplitud. El rango de ganancia es estrecho a propósito (0,07–0,14). Lo que separa un sonido chico de uno grande es **cuánto dura**: `ui()` 18 ms, `death()` 950 ms. Si quieres que algo pese más, alárgalo; no le subas el volumen. |
| **Sin reverb, sin delay, sin paneo, sin filtros** | Un altavoz de plástico no tiene espacio. La cadena es `oscilador → ganancia → master`, y nada más. |

## Prohibiciones

- **Ni un archivo de audio.** Ni `.mp3`/`.wav`/`.ogg`, ni base64 incrustado, ni `new Audio`,
  ni `fetch` de un sonido, ni ninguna API externa. El juego es un `index.html` de un solo
  archivo que funciona offline; cualquiera de esas cosas rompe esa propiedad.
- **Ninguna dependencia nueva.** Nada de Howler, Tone.js ni npm. No hay `package.json` y no
  debe haberlo.
- **Nunca `setTimeout` para secuenciar notas.** Un temporizador deriva bajo carga, no se
  cancela al mutear y no comparte reloj con el audio. Usa `seq()`, que agenda todo de golpe
  sobre `ac.currentTime`.

---

## La API

Privadas dentro del IIFE:

| Función | Qué hace |
|---|---|
| `tone(freq, at, dur, vol)` | Una nota cuadrada en tiempo **absoluto** de `AudioContext`. Aplica el suelo de frecuencia. No comprueba `quiet` (ver abajo). |
| `seq(notes, vol)` | `notes = [[Hz, ms], ...]` encadenadas desde ahora. **La forma normal de hacer un sonido.** |
| `scramble(steps, hi, lo, stepMs, vol)` | Tono que se despeña a saltos; `hi`/`lo` son índices dentro de `TONES`. La explosión. |
| `fresh(key, ms)` | Limitador. `false` si ese sonido ya sonó hace menos de `ms`. |
| `audible()` | `ready && !muted && !quiet`. |

Públicas: `init(ctx?)`, `resume()`, `tones`, `muted`, `quiet`, `setMuted(m)`, `toggleMute()`,
`engine(on)`, y los ocho efectos `ui shoot destroy pickup repair damage death level`.

`setMuted` aplica el silencio **sin guardarlo** — lo usa la carga inicial. `toggleMute` es
el que además persiste, a través del módulo `Prefs` (clave `vectordrift:muted`). El audio
no guarda nada por su cuenta: si necesitas persistir otra preferencia, amplía `Prefs`, no
inventes un segundo mecanismo.

### Los ocho efectos

| Sonido | Notas | Total |
|---|---|---|
| `ui` | 1760 | 18 ms |
| `shoot` | 2637 → 2093 → 1568 | 24 ms · limitado a 60 ms |
| `destroy` | scramble 12 pasos, índices 11 → 2 | 180 ms · limitado a 45 ms |
| `pickup` | 1047 → 1319 → 1568 | 120 ms |
| `repair` | 880 → 1047 → 1319 → 1760 | 255 ms |
| `damage` | 784 → 587 → 440 | 200 ms |
| `death` | 1568 → 1319 → 1175 → 880 → 784 → 659 → 523 → 440 | 950 ms |
| `level` | 1047 → 1319 → 1568 → 2093 | 350 ms |

`damage` y `death` son la misma idea — caer por la escala — y se distinguen **solo por la
longitud de la caída**. Eso es la dinámica por duración en acción.

### Tres detalles que se olvidan

- **`quiet` calla la simulación, no la interfaz.** Es la bandera del modo demo del menú:
  se pone en `startGame()` y se quita al salir de la demo. `ui()` la ignora a propósito
  (un toque del usuario en un botón debe sonar aunque la demo esté corriendo detrás), y
  `buzz()` la respeta (vibrar el móvil en el menú es peor que sonar). Si añades un sonido
  que dispara el bot, **tiene que** pasar por `seq()`/`scramble()`, que ya la comprueban.
- **El limitador no es opcional en bucles.** `shoot()` sale del autofuego y `destroy()`
  puede dispararse varias veces en un frame. Sin `fresh()` el resultado es barro. El
  limitador solo calla audio repetido: balas, rocas y puntaje no se enteran.
- **El motor no es una nota, es un tableteo.** Portadora cuadrada a `CFG.engineHz` que un
  LFO cuadrado a `CFG.enginePulseHz` abre y cierra, sumando la señal del LFO al valor
  intrínseco de la ganancia. Dos osciladores, cero temporizadores. Antes era un zumbido
  a 62 Hz que en un móvil sencillamente no existía.

---

## Añadir o cambiar un sonido

1. Elige las notas **de `TONES`**. Ascendente = bueno, descendente = malo, es todo el
   vocabulario que necesitas.
2. Decide la **duración** según lo importante que sea el evento. No toques el volumen salvo
   que se pierda o tape a otro; quédate dentro de 0,07–0,14.
3. Escríbelo como una línea `seq([[Hz, ms], ...], vol)` junto a los demás.
4. Si se dispara desde un bucle o puede repetirse en un frame, envuélvelo en
   `fresh('nombre', ms)`.
5. Añade su duración nominal a `SOUNDS` en `dev/audio-test.mjs` y pasa el test.
6. **Sube el número de `CACHE` en `sw.js`.**

## Verificar

```sh
node dev/audio-test.mjs          # renderiza a PCM y comprueba
npx http-server -p 8080          # luego abre /dev/audio-lab.html y escucha
```

`dev/audio-test.mjs` renderiza cada sonido con `OfflineAudioContext` (por eso `init()`
acepta un contexto) y afirma que suena, que dura lo previsto, que no satura al mezclarse
todo, que **ninguna racha del mismo signo delata energía por debajo de 380 Hz**, que
`quiet` y `muted` callan lo que deben, y que el mute sobrevive a una recarga.
`dev/audio-lab.html` carga el juego en un iframe y
pone un botón por sonido: **eso hay que escucharlo**, el test no mide gusto.

Ninguno de los dos entra en la lista `FILES` de `sw.js`: son herramientas, no parte del juego.

## Al terminar, siempre

Sube el número de `CACHE` en `sw.js` (línea 3). El service worker es cache-first: si no lo
subes, sigue sirviendo el `index.html` viejo y **parecerá que tu cambio no existe**.
