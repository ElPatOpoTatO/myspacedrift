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
