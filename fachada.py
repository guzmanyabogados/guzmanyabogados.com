# Genera assets/fachada.svg: fachada neoclásica en línea dorada (frontón, entablamento,
# columnas acanaladas, basas y gradas) para el fondo de la portada.
W, H = 1200, 760
ORO = "#C9A85C"
p = []
add = p.append

cx = W / 2
n_col = 8
col_w = 56
gap = 64
total = n_col * col_w + (n_col - 1) * gap
x0 = cx - total / 2

y_pedimento_base = 250
y_entab_top = 250
y_entab_bot = 330
y_capitel = 330
y_col_top = 352
y_col_bot = 610
y_basa = 632

# Frontón
izq, der = x0 - 70, x0 + total + 70
add(f'<path d="M{izq} {y_pedimento_base} L{cx} 120 L{der} {y_pedimento_base} Z"/>')
add(f'<path d="M{izq + 34} {y_pedimento_base - 10} L{cx} 140 L{der - 34} {y_pedimento_base - 10} Z" stroke-opacity=".6"/>')
# Entablamento: cornisa, friso con triglifos, arquitrabe
add(f'<rect x="{izq}" y="{y_entab_top}" width="{der - izq}" height="14"/>')
add(f'<rect x="{izq + 20}" y="{y_entab_top + 14}" width="{der - izq - 40}" height="40"/>')
t = izq + 40
while t < der - 60:
    add(f'<path d="M{t} {y_entab_top + 18} v32 M{t + 8} {y_entab_top + 18} v32 M{t + 16} {y_entab_top + 18} v32" stroke-opacity=".7"/>')
    t += 70
add(f'<rect x="{izq + 20}" y="{y_entab_top + 54}" width="{der - izq - 40}" height="26"/>')

# Columnas
for i in range(n_col):
    x = x0 + i * (col_w + gap)
    # capitel
    add(f'<rect x="{x - 12}" y="{y_capitel}" width="{col_w + 24}" height="10"/>')
    add(f'<path d="M{x - 6} {y_capitel + 10} Q{x + col_w / 2} {y_capitel + 26} {x + col_w + 6} {y_capitel + 10}"/>')
    # fuste con acanaladuras
    add(f'<rect x="{x}" y="{y_col_top}" width="{col_w}" height="{y_col_bot - y_col_top}"/>')
    for k in range(1, 5):
        fx = x + k * col_w / 5
        add(f'<path d="M{fx} {y_col_top + 6} V{y_col_bot - 6}" stroke-opacity=".55"/>')
    # basa
    add(f'<rect x="{x - 8}" y="{y_col_bot}" width="{col_w + 16}" height="10"/>')
    add(f'<rect x="{x - 14}" y="{y_col_bot + 10}" width="{col_w + 28}" height="12"/>')

# Gradas
for j in range(4):
    margen = 40 + j * 30
    add(f'<rect x="{izq - margen + 40}" y="{y_basa + j * 22}" width="{der - izq + 2 * margen - 80}" height="22"/>')

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="none" stroke="{ORO}" '
       f'stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">' + "".join(p) + '</svg>')
open("site/assets/fachada.svg", "w").write(svg)
print(len(svg))
