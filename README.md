# My Space Drift

Juego web (PWA) jugable desde el navegador.

**Jugar:** https://elpatopotato.github.io/myspacedrift/

- `index.html` — juego completo (canvas + JS)
- `sw.js` — service worker, cache-first (funciona offline tras la primera carga)
- `manifest.webmanifest` — instalable como app
- `.nojekyll` — evita que GitHub Pages procese el sitio con Jekyll

## Instalar

Abrir el enlace en el móvil y usar "Añadir a pantalla de inicio". Tras la
primera carga el juego funciona sin conexión.

## Desarrollo

Todo el juego vive en `index.html` (un solo archivo). Al cambiarlo, subir el
número de `CACHE` en `sw.js` para que el service worker sirva la versión nueva.

### Audio

Los sonidos se sintetizan en el navegador (nada grabado, ningún archivo). Las reglas
de diseño están en `.claude/skills/lcd-audio/SKILL.md`. Herramientas, fuera del juego:

```sh
node dev/audio-test.mjs     # renderiza cada sonido a PCM y lo comprueba
npx http-server -p 8080     # y abre /dev/audio-lab.html para escucharlos
```
