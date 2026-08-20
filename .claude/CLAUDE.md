# Cómo se cierra el trabajo en este repo

## Si las comprobaciones pasan: push y merge, sin preguntar

Terminada una tarea, **no hay que pedir permiso para publicarla**. El camino es
siempre el mismo y se recorre entero:

1. **Correr las comprobaciones de `dev/`**, todas, no una muestra:

   ```sh
   node dev/audio-test.mjs
   node dev/input-test.mjs
   node dev/entry-test.mjs
   node dev/layout-test.mjs
   node dev/demo-test.mjs
   node dev/trail-test.mjs
   node dev/lcd-test.mjs
   node dev/pickup-test.mjs
   node dev/collide-test.mjs
   ```

   Tardan minutos: hay que darles tiempo, no cortarlas por impaciencia. Una
   comprobación que no llegó a terminar **no cuenta como pasada**.

2. Si **todas** dicen `todo correcto` / `todo bien`:
   - subir el número de `CACHE` en `sw.js` (siempre que se haya tocado
     `index.html`), que si no el service worker sigue sirviendo la versión vieja;
   - commit con mensaje descriptivo;
   - `git push -u origin <rama>`;
   - abrir el PR si no existe, sacarlo de borrador y **mergearlo con squash**
     contra `main`, que es como se mergeó todo lo demás (`Título (#nn)`);
   - borrar la rama remota después del merge.

3. Si **alguna falla**: no se mergea nada. Se arregla el fallo y se vuelve al
   punto 1. Nunca se saltea, se desactiva ni se "cuarentena" una comprobación
   para llegar a verde.

### Lo que sigue necesitando que el humano diga que sí

- Un merge con conflictos contra `main`, o un PR que otra persona esté revisando.
- Reescribir historia ajena: nada de `rebase`, `amend` ni `--force` sobre una
  rama que no se creó en esta sesión.
- Tocar `main` directamente: siempre rama + PR, aunque el cambio sea de una línea.

## Recordatorios del repo

- Todo el juego vive en `index.html`, un solo archivo, sin dependencias ni
  `package.json`. Playwright se resuelve de donde esté instalado.
- `media/` son fotos y GIFs para mostrar el juego, no archivos del juego: se
  regeneran con `node dev/capture-media.mjs` cuando cambia lo que enseñan.
- Las reglas de los sonidos están en `.claude/skills/lcd-audio/SKILL.md`.
