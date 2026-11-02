"""Original 2D artwork for the Culture page — CHIDAOBA CULTURE visual language.
Flat, geometric, brand palette only. All SVG, generated deterministically."""
import math, random

CARBON, CARBON2, CHALK, CHALK2, RED, GREY, SAND = "#202020", "#2B2B2B", "#F2F1EC", "#E6E4DC", "#B32632", "#777C80", "#B7A995"

def _svg(w, h, body, label, cls=""):
    c = f' class="{cls}"' if cls else ""
    return (f'<svg{c} viewBox="0 0 {w} {h}" role="img" aria-label="{label}" '
            f'xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">{body}</svg>')

def _wrestler_top(cx, cy, ang, jacket, head, belt, k=1.0):
    """Wrestler seen from above, facing direction ang (deg). Arms reach forward to grip."""
    a = math.radians(ang)
    fx, fy = math.cos(a), math.sin(a)          # forward
    sx, sy = -fy, fx                            # shoulder axis
    def P(f, s): return (cx + (fx * f + sx * s) * k, cy + (fy * f + sy * s) * k)
    # shoulders (jacket) as rounded rectangle via thick line
    l, r = P(0, -44), P(0, 44)
    out = f'<line x1="{l[0]:.1f}" y1="{l[1]:.1f}" x2="{r[0]:.1f}" y2="{r[1]:.1f}" stroke="{jacket}" stroke-width="{46*k:.1f}" stroke-linecap="round"/>'
    # belt hint (behind, slightly back)
    bl, br = P(-14, -30), P(-14, 30)
    out += f'<line x1="{bl[0]:.1f}" y1="{bl[1]:.1f}" x2="{br[0]:.1f}" y2="{br[1]:.1f}" stroke="{belt}" stroke-width="{5*k:.1f}" stroke-linecap="round" opacity=".9"/>'
    # arms: shoulder -> forward grip
    for s in (-1, 1):
        sh, el, ha = P(4, 40 * s), P(46, 46 * s), P(84, 30 * s)
        out += (f'<polyline points="{sh[0]:.1f},{sh[1]:.1f} {el[0]:.1f},{el[1]:.1f} {ha[0]:.1f},{ha[1]:.1f}" fill="none" '
                f'stroke="{jacket}" stroke-width="{20*k:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')
        out += f'<circle cx="{ha[0]:.1f}" cy="{ha[1]:.1f}" r="{9*k:.1f}" fill="{head}"/>'
    hx, hy = P(6, 0)
    out += f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="{19*k:.1f}" fill="{head}"/>'
    return out

def hero(cls="c-hero-art"):
    """The circle from above: crowd ring, arena, two wrestlers, two musicians."""
    W, H, cx, cy = 1600, 1000, 1220, 470
    rnd = random.Random(7)
    b = f'<rect width="{W}" height="{H}" fill="{CARBON}"/>'
    # faint concentric guides
    for r, o in ((560, .05), (700, .035)):
        b += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{CHALK}" stroke-opacity="{o}" stroke-width="1"/>'
    # crowd: several rings of heads
    for ring in range(5):
        R = 330 + ring * 30
        n = int(2 * math.pi * R / 26)
        for i in range(n):
            t = i / n * 2 * math.pi + ring * .13 + rnd.uniform(-.02, .02)
            rr = R + rnd.uniform(-6, 6)
            x, y = cx + rr * math.cos(t), cy + rr * math.sin(t)
            if not (-60 < x < W + 60 and -60 < y < H + 60): continue
            col = rnd.choice([SAND, SAND, GREY, CHALK, GREY])
            op = rnd.uniform(.35, .85) * (1 - ring * .12)
            b += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rnd.uniform(7, 10.5):.1f}" fill="{col}" fill-opacity="{op:.2f}"/>'
    # arena floor
    b += f'<circle cx="{cx}" cy="{cy}" r="300" fill="{CARBON2}"/>'
    b += f'<circle cx="{cx}" cy="{cy}" r="300" fill="none" stroke="{CHALK}" stroke-opacity=".55" stroke-width="2"/>'
    b += f'<circle cx="{cx}" cy="{cy}" r="170" fill="none" stroke="{CHALK}" stroke-opacity=".12" stroke-width="1.5" stroke-dasharray="4 8"/>'
    # musicians at the edge (zurna + doli) in red
    for t, kind in ((-2.35, "zurna"), (-2.12, "doli")):
        x, y = cx + 268 * math.cos(t), cy + 268 * math.sin(t)
        b += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="15" fill="{RED}"/>'
        if kind == "doli":
            b += f'<circle cx="{x + 22:.1f}" cy="{y + 10:.1f}" r="13" fill="none" stroke="{RED}" stroke-width="4"/>'
        else:
            ex, ey = x + 40 * math.cos(t + 2.4), y + 40 * math.sin(t + 2.4)
            b += f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{ex:.1f}" y2="{ey:.1f}" stroke="{RED}" stroke-width="5" stroke-linecap="round"/>'
            b += f'<circle cx="{ex:.1f}" cy="{ey:.1f}" r="7" fill="{RED}"/>'
    # sound waves from musicians
    mx, my = cx + 268 * math.cos(-2.24), cy + 268 * math.sin(-2.24)
    for k in range(3):
        rr = 46 + k * 22
        b += (f'<path d="M{mx + rr * math.cos(-2.24 + 2.3):.1f} {my + rr * math.sin(-2.24 + 2.3):.1f} '
              f'A{rr} {rr} 0 0 1 {mx + rr * math.cos(-2.24 + 3.9):.1f} {my + rr * math.sin(-2.24 + 3.9):.1f}" '
              f'fill="none" stroke="{RED}" stroke-opacity="{.6 - k * .17:.2f}" stroke-width="2.5"/>')
    # wrestlers
    b += _wrestler_top(cx - 100, cy + 12, -8, CHALK, "#FFFFFF", RED, 1.6)
    b += _wrestler_top(cx + 100, cy - 12, 172, SAND, "#D9CFC0", CARBON, 1.6)
    # red belt line echo across the composition
    b += f'<rect x="0" y="{cy - 2}" width="{cx - 330}" height="3" fill="{RED}" opacity=".0"/>'
    return _svg(W, H, b, "Illustration: a Chidaoba bout seen from above — two wrestlers gripping in the centre of an open-air circle, spectators around, zurna and doli musicians at the edge", cls)

def chokha(cls=""):
    """Flat front view of a wrestling chokha with grip zones."""
    W, H = 900, 900
    b = f'<rect width="{W}" height="{H}" fill="{CHALK2}"/>'
    J = SAND
    # body
    body = "M330 210 L370 190 L450 240 L530 190 L570 210 L640 240 L700 470 L640 500 L610 380 L618 640 L282 640 L290 380 L260 500 L200 470 L260 240 Z"
    b += f'<path d="{body}" fill="{J}"/>'
    # shading of sleeves
    b += f'<path d="M260 240 L200 470 L260 500 L290 380 Z" fill="#000" fill-opacity=".07"/><path d="M640 240 L700 470 L640 500 L610 380 Z" fill="#000" fill-opacity=".07"/>'
    # high collar
    b += f'<path d="M370 190 L450 240 L530 190 L520 160 L450 200 L380 160 Z" fill="#A3947F"/>'
    # front opening + lapel edges
    b += f'<path d="M450 240 L450 640" stroke="{CARBON}" stroke-opacity=".35" stroke-width="3"/>'
    b += f'<path d="M450 240 L405 330 L450 360 M450 240 L495 330 L450 360" fill="none" stroke="{CARBON}" stroke-opacity=".25" stroke-width="3"/>'
    # belt
    b += f'<rect x="290" y="520" width="320" height="34" fill="{CARBON}"/>'
    b += f'<rect x="438" y="514" width="24" height="46" fill="{CARBON2}" stroke="{SAND}" stroke-opacity=".4"/>'
    # cuffs + hem stitching
    b += f'<path d="M200 470 L260 500" stroke="{CARBON}" stroke-opacity=".35" stroke-width="10"/><path d="M700 470 L640 500" stroke="{CARBON}" stroke-opacity=".35" stroke-width="10"/>'
    b += f'<path d="M292 626 L608 626" stroke="{CARBON}" stroke-opacity=".3" stroke-width="2" stroke-dasharray="6 6"/>'
    # grip zones
    zones = [(410, 215, "Collar"), (495, 300, "Lapel"), (250, 400, "Sleeve"), (575, 537, "Belt")]
    for x, y, t in zones:
        b += f'<circle cx="{x}" cy="{y}" r="26" fill="none" stroke="{RED}" stroke-width="3"/><circle cx="{x}" cy="{y}" r="7" fill="{RED}"/>'
    # leader lines + labels
    labels = [(410, 215, 170, 150, "COLLAR"), (495, 300, 760, 230, "LAPEL"), (250, 400, 110, 560, "SLEEVE"), (575, 537, 770, 620, "BELT")]
    for x, y, lx, ly, t in labels:
        b += f'<path d="M{x} {y} L{lx} {ly}" stroke="{RED}" stroke-width="1.5"/>'
        anchor = "end" if lx < x else "start"
        dx = -10 if lx < x else 10
        b += (f'<text x="{lx + dx}" y="{ly + 6}" text-anchor="{anchor}" font-family="Inter, Arial, sans-serif" font-size="20" '
              f'font-weight="600" letter-spacing="3" fill="{CARBON}">{t}</text>')
    return _svg(W, H, b, "Illustration: a wrestling chokha — high collar, sleeves and belt — with the grip points marked", cls)

def holds(cls=""):
    """≈200 holds: a field of 200 points, a few combinations connected."""
    W, H = 1600, 560
    cols, rows = 25, 8
    rnd = random.Random(11)
    gx, gy = W / (cols + 1), H / (rows + 1)
    pts = [((c + 1) * gx + rnd.uniform(-8, 8), (r + 1) * gy + rnd.uniform(-8, 8)) for r in range(rows) for c in range(cols)]
    b = f'<rect width="{W}" height="{H}" fill="{CHALK}"/>'
    # combinations: short chains of nearby points
    chains = []
    for _ in range(9):
        i = rnd.randrange(len(pts)); chain = [i]
        for _ in range(rnd.randint(2, 4)):
            r_, c_ = divmod(chain[-1], cols)
            nr = min(rows - 1, max(0, r_ + rnd.choice([-1, 0, 1]))); nc = min(cols - 1, max(0, c_ + rnd.choice([1, 1, 2])))
            chain.append(nr * cols + nc)
        chains.append(chain)
    hot = set()
    for k, ch in enumerate(chains):
        col = RED if k in (2, 6) else CARBON
        d = "M" + " L".join(f"{pts[i][0]:.1f} {pts[i][1]:.1f}" for i in ch)
        b += f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{3 if col == RED else 1.6}" stroke-opacity="{1 if col == RED else .55}" stroke-linejoin="round"/>'
        if col == RED: hot.update(ch)
    for i, (x, y) in enumerate(pts):
        if i in hot:
            b += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="9" fill="{RED}"/>'
        else:
            b += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{5 if rnd.random() > .2 else 7}" fill="{CARBON}" fill-opacity="{rnd.uniform(.35, .9):.2f}"/>'
    return _svg(W, H, b, "Illustration: 200 points standing for Chidaoba’s holds and counter-holds, with a few combinations connected", cls)

def instruments(cls=""):
    """Zurna and doli, flat."""
    W, H = 1000, 760
    b = f'<rect width="{W}" height="{H}" fill="{CARBON2}"/>'
    # circle backdrop
    b += f'<circle cx="500" cy="380" r="300" fill="none" stroke="{CHALK}" stroke-opacity=".12" stroke-width="2"/>'
    # doli: cylinder drum
    dx, dy = 650, 320
    b += f'<ellipse cx="{dx}" cy="{dy + 230}" rx="160" ry="40" fill="#1A1A1A" opacity=".6"/>'
    b += f'<path d="M{dx - 150} {dy} L{dx - 150} {dy + 200} A150 40 0 0 0 {dx + 150} {dy + 200} L{dx + 150} {dy} Z" fill="{SAND}"/>'
    b += f'<path d="M{dx + 40} {dy} L{dx + 40} {dy + 238} L{dx + 150} {dy + 200} L{dx + 150} {dy} Z" fill="#000" fill-opacity=".08"/>'
    # lacing zig-zag
    zz = " ".join(f"{dx - 150 + i * 30} {dy + (6 if i % 2 == 0 else 190) + (0 if i % 2 == 0 else (math.sin((i * 30 - 150) / 150 * math.pi / 2 + math.pi / 2) * 0))}" for i in range(11))
    b += f'<polyline points="{zz}" fill="none" stroke="{CARBON}" stroke-width="3" stroke-opacity=".75"/>'
    b += f'<path d="M{dx - 150} {dy + 200} A150 40 0 0 0 {dx + 150} {dy + 200}" fill="none" stroke="{CARBON}" stroke-width="10" stroke-opacity=".6"/>'
    b += f'<ellipse cx="{dx}" cy="{dy}" rx="150" ry="40" fill="{CHALK}"/>'
    b += f'<ellipse cx="{dx}" cy="{dy}" rx="150" ry="40" fill="none" stroke="{CARBON}" stroke-width="10" stroke-opacity=".6"/>'
    # rhythm marks on drum head
    b += f'<circle cx="{dx - 40}" cy="{dy - 4}" r="6" fill="{RED}"/><circle cx="{dx + 30}" cy="{dy + 8}" r="6" fill="{RED}"/>'
    # zurna: conical pipe, diagonal
    zx, zy, ang = 170, 600, -56
    a = math.radians(ang); ux, uy = math.cos(a), math.sin(a); px, py = -uy, ux
    L = 430
    def Q(t, w): return (zx + ux * t + px * w, zy + uy * t + py * w)
    pts = [Q(0, 9), Q(L * .66, 15), Q(L * .82, 24), Q(L, 52), Q(L, -52), Q(L * .82, -24), Q(L * .66, -15), Q(0, -9)]
    b += '<path d="M' + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + f' Z" fill="{CHALK}"/>'
    b += '<path d="M' + " L".join(f"{x:.1f} {y:.1f}" for x, y in [Q(L * .66, 15), Q(L * .82, 24), Q(L, 52), Q(L, -52), Q(L * .82, -24), Q(L * .66, -15)]) + f' Z" fill="{SAND}"/>'
    for t in (.18, .25, .32, .39, .46, .53, .6):
        x, y = Q(L * t, 0)
        b += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5.5" fill="{CARBON}"/>'
    m0, m1 = Q(-34, 0), Q(0, 0)
    b += f'<line x1="{m0[0]:.1f}" y1="{m0[1]:.1f}" x2="{m1[0]:.1f}" y2="{m1[1]:.1f}" stroke="{CHALK}" stroke-width="8" stroke-linecap="round"/>'
    disc = Q(-6, 0)
    b += f'<line x1="{(disc[0] + px * 20):.1f}" y1="{(disc[1] + py * 20):.1f}" x2="{(disc[0] - px * 20):.1f}" y2="{(disc[1] - py * 20):.1f}" stroke="{SAND}" stroke-width="6" stroke-linecap="round"/>'
    # sound arcs from the bell
    bx, by = Q(L + 20, 0)
    for k in range(3):
        rr = 40 + k * 34
        s0 = (bx + rr * math.cos(a - .7), by + rr * math.sin(a - .7)); s1 = (bx + rr * math.cos(a + .7), by + rr * math.sin(a + .7))
        b += f'<path d="M{s0[0]:.1f} {s0[1]:.1f} A{rr} {rr} 0 0 1 {s1[0]:.1f} {s1[1]:.1f}" fill="none" stroke="{RED}" stroke-width="3" stroke-opacity="{.9 - k * .25:.2f}"/>'
    return _svg(W, H, b, "Illustration: a zurna, the Georgian wind instrument, and a doli, the Georgian drum", cls)

def villages(cls=""):
    """A circle in every village: a field of small arenas."""
    W, H = 1600, 520
    rnd = random.Random(5)
    b = f'<rect width="{W}" height="{H}" fill="{CARBON}"/>'
    for r in range(5):
        for c in range(19):
            x = 70 + c * laststep(W, 19) + (laststep(W, 19) / 2 if r % 2 else 0)
            y = 70 + r * 95
            if x > W - 40: continue
            R = rnd.uniform(16, 30)
            b += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{R:.1f}" fill="none" stroke="{CHALK}" stroke-opacity="{rnd.uniform(.25, .7):.2f}" stroke-width="2"/>'
            if rnd.random() < .55:
                b += f'<circle cx="{x - R * .18:.1f}" cy="{y:.1f}" r="{R * .16:.1f}" fill="{SAND}"/><circle cx="{x + R * .18:.1f}" cy="{y:.1f}" r="{R * .16:.1f}" fill="{CHALK}"/>'
            if rnd.random() < .025:
                b += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{R + 8:.1f}" fill="none" stroke="{RED}" stroke-width="3"/>'
    return _svg(W, H, b, "Illustration: dozens of small wrestling circles — a Chidaoba section in almost every village and city", cls)

def laststep(W, n): return (W - 140) / (n - 1)

def era_icon(kind):
    """Small line icons for the history timeline (48x48)."""
    s = f'stroke="{CHALK}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"'
    p = {
        "combat": f'<path d="M10 38 L34 14 M30 10 L38 18 M14 10 L38 34 M10 30 L18 38" {s}/><path d="M34 14 L38 10" {s}/>',
        "circle": f'<circle cx="24" cy="24" r="16" {s}/><circle cx="20" cy="24" r="3" fill="{SAND}"/><circle cx="28" cy="24" r="3" fill="{CHALK}"/>',
        "code": f'<path d="M14 8 H32 L36 12 V40 H14 Z M20 18 H30 M20 24 H30 M20 30 H26" {s}/>',
        "hands": f'<path d="M8 28 C14 22 20 22 24 26 C28 22 34 22 40 28 M14 32 L22 32 M26 32 L34 32" {s}/><circle cx="24" cy="14" r="4" {s}/>',
        "mark": f'<circle cx="24" cy="24" r="16" {s}/><path d="M17 24 L22 29 L31 19" stroke="{RED}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    }[kind]
    return f'<svg class="era-ico" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">{p}</svg>'
