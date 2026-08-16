#!/usr/bin/env python3
"""Genera los iconos del juego.

Los iconos no se dibujan a mano: se rasterizan con la misma geometria y las
mismas reglas que la pantalla del juego (index.html), asi que si la nave o la
paleta cambian, se cambia el mismo numero aca y los PNG vuelven a salir iguales
al juego.

  - la nave es makeShipOutline() portado tal cual (CFG.shipLen / CFG.shipWid)
  - el trazo pasa por el mismo Bresenham de VRAM.line, un punto = un pixel LCD
  - los tonos son CFG.gbPalette y se cuantizan con la regla de VRAM.blit
  - la reticula de puntos del LCD es CFG.lcdGrid

El icono es la nave sola: contorno pleno sobre fondo, sin llama ni estela. A
48 px —el tamano real en el cajon de apps— cualquier cosa que se le agregue
deja de leerse como nave y empieza a leerse como suciedad.

Uso:  python3 tools/make-icons.py        (escribe los PNG en la raiz del repo)
"""

import math
import os

from PIL import Image

# ----------------------------------------------------------------- CFG ------
# Los mismos valores que CFG en index.html. Si alla cambian, cambian aca.
GB_PALETTE = ['#000000', '#545454', '#a8a8a8', '#ffffff']   # de oscuro a claro
LCD_GRID = 0.10          # fuerza de la reticula entre celdas del LCD
SHIP_LEN = 27.0
SHIP_WID = 20.25
TILE = 8                 # la rejilla a la que se alinea toda la interfaz

ANGLE = -math.pi / 4     # la nave sube hacia la derecha, como el icono viejo
STROKE = 2               # puntos de ancho del contorno (§ el trazo del juego es 1,
                         # pero a tamano de icono uno solo desaparece)

# ------------------------------------------------------------ geometria -----


def make_ship_outline():
    """makeShipOutline() de index.html: triangulo alargado con la popa curvada
    hacia adentro. Devuelve la lista de puntos del contorno."""
    L, Wd = SHIP_LEN / 2, SHIP_WID / 2
    nose, rc, lc = (L, 0.0), (-L, Wd), (-L, -Wd)
    lerp = lambda a, b, t: (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)

    pts = [nose, lerp(nose, rc, 1 / 3), lerp(nose, rc, 2 / 3), rc]
    cx, cy = -L * 0.28, 0.0                       # control de la curva concava
    for i in range(1, 7):                         # popa curvada hacia adentro
        t = i / 6
        u = 1 - t
        pts.append((u * u * rc[0] + 2 * u * t * cx + t * t * lc[0],
                    u * u * rc[1] + 2 * u * t * cy + t * t * lc[1]))
    pts += [lerp(lc, nose, 1 / 3), lerp(lc, nose, 2 / 3)]
    return pts


SHIP_PTS = make_ship_outline()

# --------------------------------------------------------------- VRAM -------


class Vram:
    """El buffer de intensidades del juego: cada celda es un punto del LCD,
    prendido o apagado, y el trazo mas fuerte manda."""

    def __init__(self, size, stroke=1):
        self.n = size
        self.stroke = stroke
        self.buf = [0.0] * (size * size)

    def plot(self, x, y, v):
        if 0 <= x < self.n and 0 <= y < self.n:
            i = y * self.n + x
            if v > self.buf[i]:
                self.buf[i] = v

    def dot(self, x, y, v):
        """VRAM.dot: el trazo grueso es un cuadrado de puntos, no un pixel mas
        grande — asi los bordes siguen cayendo en la rejilla del LCD."""
        for dy in range(self.stroke):
            for dx in range(self.stroke):
                self.plot(x + dx, y + dy, v)

    def line(self, ax, ay, bx, by, v):
        """Bresenham, igual que VRAM.line."""
        x0, y0 = round(ax), round(ay)
        x1, y1 = round(bx), round(by)
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx + dy
        while True:
            self.dot(x0, y0, v)
            if x0 == x1 and y0 == y1:
                return
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x0 += sx
            if e2 <= dx:
                err += dx
                y0 += sy

    def poly_at(self, pts, x, y, a, scale, v, close=True):
        """Contorno rotado, escalado y trasladado (VRAM.polyAt)."""
        ca, sa = math.cos(a), math.sin(a)
        px = lambda p: x + (p[0] * ca - p[1] * sa) * scale
        py = lambda p: y + (p[0] * sa + p[1] * ca) * scale
        for i in range(len(pts) - 1):
            self.line(px(pts[i]), py(pts[i]), px(pts[i + 1]), py(pts[i + 1]), v)
        if close and len(pts) > 1:
            self.line(px(pts[-1]), py(pts[-1]), px(pts[0]), py(pts[0]), v)

    def quantize(self):
        """La regla de VRAM.blit: la intensidad cae en uno de los cuatro tonos."""
        return [min(3, round(v * 3)) for v in self.buf]


# ------------------------------------------------------------ composicion ---


def center(cells, grid):
    """Deja la nave centrada por su caja real. Girada 45 grados el contorno no
    queda centrado en su propio origen, y un icono descentrado se nota."""
    on = [i for i, c in enumerate(cells) if c]
    xs = [i % grid for i in on]
    ys = [i // grid for i in on]
    dx = round((grid - 1 - max(xs) - min(xs)) / 2)
    dy = round((grid - 1 - max(ys) - min(ys)) / 2)
    out = [0] * (grid * grid)
    for i in on:
        x, y = i % grid + dx, i // grid + dy
        out[y * grid + x] = cells[i]
    return out


def compose(grid, ship_len):
    """Dibuja la nave en una rejilla de 'grid' puntos de LCD."""
    v = Vram(grid, STROKE)
    v.poly_at(SHIP_PTS, grid / 2 - 0.5, grid / 2 - 0.5, ANGLE, ship_len / SHIP_LEN, 1.0)
    return center(v.quantize(), grid)


# --------------------------------------------------------------- salida -----


def rgb(hex_color):
    return tuple(int(hex_color[i:i + 2], 16) for i in (1, 3, 5))


PALETTE = [rgb(c) for c in GB_PALETTE]


def render(cells, grid, scale, canvas, lattice):
    """Escala la rejilla a pixel duro (nearest) y la centra en el lienzo final.
    Con 'lattice' marca la separacion entre celdas del LCD, como hace el shader:
    solo tiene sentido cuando una celda mide varios pixeles."""
    img = Image.new('RGB', (canvas, canvas), PALETTE[0])
    px = img.load()
    off = (canvas - grid * scale) // 2

    for gy in range(grid):
        for gx in range(grid):
            tone = cells[gy * grid + gx]
            if tone == 0:
                continue                        # el fondo ya esta pintado
            r, g, b = PALETTE[tone]
            dim = tuple(int(c * (1 - LCD_GRID)) for c in (r, g, b))
            for y in range(scale):
                for x in range(scale):
                    edge = lattice and (x == scale - 1 or y == scale - 1)
                    px[off + gx * scale + x, off + gy * scale + y] = dim if edge else (r, g, b)
    return img


def check_maskable(cells, grid):
    """El sistema puede recortar un icono maskable hasta el circulo central: el
    80% del lado. Se mide el punto encendido mas lejos del centro y se avisa si
    se sale."""
    c = grid / 2
    reach = max(math.hypot(i % grid + dx - c, i // grid + dy - c)
                for i, tone in enumerate(cells) if tone
                for dx in (0, 1) for dy in (0, 1))
    safe = grid * 0.4
    print('    zona segura: %.1f / %.1f puntos  %s'
          % (reach, safe, 'OK' if reach <= safe else 'SE RECORTA'))


# Un icono por uso. La rejilla siempre es multiplo de la de 8x8 del juego y la
# escala es entera: el pixel tiene que quedar duro.
#   grid   puntos de LCD de lado          ship   largo de la nave en puntos
#   scale  pixeles por punto              canvas lado del PNG
ICONS = [
    # Los dos tamanos que pide la spec del manifest.
    dict(name='icon-512.png', canvas=512, grid=TILE * 4, ship=20, scale=16, lattice=True),
    dict(name='icon-192.png', canvas=192, grid=TILE * 4, ship=20, scale=6, lattice=False),
    # iOS redondea las esquinas: la nave entra un punto mas chica y el lienzo
    # queda con borde propio (32 puntos x 5 px = 160 dentro de 180).
    dict(name='icon-180.png', canvas=180, grid=TILE * 4, ship=19, scale=5, lattice=False),
    # Maskable: tiene que caber en el circulo central del 80%.
    dict(name='icon-maskable-512.png', canvas=512, grid=TILE * 4, ship=15, scale=16,
         lattice=True, maskable=True),
]


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for spec in ICONS:
        cells = compose(spec['grid'], spec['ship'])
        img = render(cells, spec['grid'], spec['scale'], spec['canvas'], spec['lattice'])
        img.save(os.path.join(root, spec['name']), 'PNG', optimize=True)
        print('%-24s %dx%d' % (spec['name'], spec['canvas'], spec['canvas']))
        if spec.get('maskable'):
            check_maskable(cells, spec['grid'])


if __name__ == '__main__':
    main()
