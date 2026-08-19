#!/usr/bin/env bash
#
# Sube el juego a itch.io con butler.
#
#   tools/publish-itch.sh              # sube
#   tools/publish-itch.sh --dry-run    # dice que subiria, sin subir nada
#
# Lo que se sube NO es el repositorio: es el juego. La lista sale del propio
# service worker —FILES en sw.js es, por definicion, todo lo que el juego necesita
# para arrancar sin internet— mas el sw.js. Asi no hay dos listas que se puedan
# desincronizar, y ni dev/, ni media/, ni marketing/, ni el README viajan a la
# ficha.
#
# La version tambien sale de sw.js: el numero de CACHE es lo que ya hay que subir
# cada vez que cambia index.html, asi que es el numero que de verdad distingue una
# build de otra. Si te olvidaste de subirlo, butler subira otra build con la misma
# version, que es exactamente el aviso que hace falta.
#
# Hace falta butler (https://itch.io/docs/butler/installing.html) y estar
# autenticado: 'butler login' una vez, o la variable BUTLER_API_KEY (que es como se
# hace desde CI, con la clave de https://itch.io/user/settings/api-keys).
#
# El destino se puede cambiar sin tocar el archivo:
#   ITCH_TARGET=usuario/juego ITCH_CHANNEL=html5 tools/publish-itch.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${ITCH_TARGET:-elpatopotato/my-space-drift}"
CHANNEL="${ITCH_CHANNEL:-html5}"
DRY=0
[ "${1:-}" = "--dry-run" ] && DRY=1

cd "$ROOT"

# --- que subir: lo que precachea el service worker, mas el service worker ---
# Solo el bloque de FILES: sw.js nombra tambien './index.html' en el fallback del
# fetch, y leyendo el archivo entero se subia dos veces.
mapfile -t FILES < <(sed -n '/^const FILES = \[/,/\];/p' sw.js \
  | grep -o "'\./[^']*'" | tr -d "'" | sed 's|^\./||' | grep -v '^$')
FILES+=(sw.js)

if [ "${#FILES[@]}" -lt 2 ]; then
  echo "no se pudo leer la lista de archivos de sw.js" >&2
  exit 1
fi
for f in "${FILES[@]}"; do
  [ -f "$f" ] || { echo "falta $f, que sw.js dice que el juego necesita" >&2; exit 1; }
done

# --- que version: la del cache del service worker ---
VERSION="$(sed -n "s/^const CACHE = '[^']*-v\([0-9][0-9]*\)';/\1/p" sw.js)"
if [ -z "$VERSION" ]; then
  echo "no se pudo leer el numero de CACHE de sw.js" >&2
  exit 1
fi

echo "  destino   $TARGET:$CHANNEL"
echo "  version   $VERSION  (CACHE de sw.js)"
echo "  archivos  ${FILES[*]}"

if [ "$DRY" = 1 ]; then
  echo
  echo "  (--dry-run: no se subio nada)"
  exit 0
fi

if ! command -v butler >/dev/null 2>&1; then
  cat >&2 <<'MSG'

Falta butler. Se baja de https://itch.io/docs/butler/installing.html (o viene con la
app de itch, en Settings -> Install butler). Despues, una vez:

  butler login

MSG
  exit 2
fi

# --- se arma la carpeta a subir, con el juego y nada mas ---
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
for f in "${FILES[@]}"; do cp "$f" "$STAGE/"; done

# --if-changed: si el contenido es identico al de la ultima build, no sube otra.
butler push "$STAGE" "$TARGET:$CHANNEL" --userversion "$VERSION" --if-changed

cat <<MSG

listo. Lo que butler no puede tocar, y hay que dejar puesto una vez en la ficha
(Edit game, https://itch.io/dashboard):

  - Kind of project: HTML
  - el archivo subido, marcado 'This file will be played in the browser'
  - Embed: 1024 x 576, 'Click to launch in fullscreen' y 'Mobile friendly'

El alto de 576 son las 144 filas del LCD por cuatro: asi cada punto del juego cae en
cuatro pixeles enteros y la reticula no cojea.

El texto de la ficha esta en marketing/itch/PAGE.md.
MSG
