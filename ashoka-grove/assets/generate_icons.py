#!/usr/bin/env python3
"""Generate Ashoka Grove PWA icons: a glowing diya cradled by a lotus under a
crescent moon, on an indigo moonlit-night tile. Rendered at 4x then LANCZOS."""
import math, os
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SS = 4  # supersample

NIGHT_TOP = (10, 10, 36)
NIGHT_MID = (24, 22, 64)
NIGHT_LOW = (16, 18, 52)
MOON = (236, 242, 255)
MOON_GLOW = (180, 200, 255)
GOLD = (255, 209, 74)
GOLDLT = (255, 243, 200)
FLAME_HOT = (255, 246, 214)
FLAME = (255, 168, 60)
LOTUS = (255, 150, 192)
LOTUS_LT = (255, 200, 224)
LOTUS_DK = (210, 90, 150)
BOWL = (200, 150, 70)
BOWL_DK = (120, 78, 28)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_base(S):
    img = Image.new("RGB", (S, S))
    d = ImageDraw.Draw(img)
    for y in range(S):
        t = y / S
        col = lerp(NIGHT_TOP, NIGHT_MID, t / 0.6) if t < 0.6 else lerp(NIGHT_MID, NIGHT_LOW, (t - 0.6) / 0.4)
        d.line([(0, y), (S, y)], fill=col)
    # stars
    import random
    random.seed(7)
    for _ in range(60):
        x, y = random.random() * S, random.random() * S * 0.6
        r = random.random() * S * 0.004 + S * 0.002
        a = int(120 + random.random() * 120)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(230, 238, 255))
    # warm halo behind the flame
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy, R = S * 0.5, S * 0.56, S * 0.34
    steps = int(R)
    for i in range(steps, 0, -1):
        t = i / steps
        a = int(150 * (1 - t) ** 1.8)
        r = R * t
        gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GOLDLT + (a,))
    glow = glow.filter(ImageFilter.GaussianBlur(S * 0.02))
    img = img.convert("RGBA")
    img.alpha_composite(glow)
    return img


def draw_moon(img, S, scale):
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    mx, my, mr = S * 0.72, S * 0.24, S * 0.13 * scale
    # soft moon glow
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i in range(int(mr * 2.6), 0, -1):
        t = i / (mr * 2.6)
        gd.ellipse([mx - i, my - i, mx + i, my + i], fill=MOON_GLOW + (int(40 * (1 - t) ** 2),))
    glow = glow.filter(ImageFilter.GaussianBlur(S * 0.01))
    layer.alpha_composite(glow)
    # crescent: full moon minus an offset disc
    d.ellipse([mx - mr, my - mr, mx + mr, my + mr], fill=MOON + (255,))
    off = mr * 0.5
    d.ellipse([mx - mr + off, my - mr - off * 0.3, mx + mr + off, my + mr - off * 0.3], fill=(0, 0, 0, 0))
    # erase with night by compositing a cutout
    cut = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cut)
    cd.ellipse([mx - mr + off, my - mr - off * 0.3, mx + mr + off, my + mr - off * 0.3], fill=(0, 0, 0, 255))
    layer = Image.composite(Image.new("RGBA", (S, S), (0, 0, 0, 0)), layer, cut)
    img.alpha_composite(layer)
    return img


def draw_lotus_diya(img, S, scale):
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx, cy = S * 0.5, S * 0.62
    pr = S * 0.20 * scale  # petal length

    # back petals
    def petal(angle, length, width, col):
        ax, ay = math.cos(angle), math.sin(angle)
        tipx, tipy = cx + ax * length, cy + ay * length
        px, py = -ay, ax
        pts = [
            (cx, cy),
            (cx + ax * length * 0.5 + px * width, cy + ay * length * 0.5 + py * width),
            (tipx, tipy),
            (cx + ax * length * 0.5 - px * width, cy + ay * length * 0.5 - py * width),
        ]
        d.polygon(pts, fill=col)

    for ang in [-0.95, -0.5, 0.5, 0.95]:
        petal(-math.pi / 2 + ang, pr * 1.05, pr * 0.34, LOTUS_DK)
    for ang in [-0.62, -0.2, 0.2, 0.62]:
        petal(-math.pi / 2 + ang, pr * 1.12, pr * 0.36, LOTUS)
    petal(-math.pi / 2, pr * 1.18, pr * 0.4, LOTUS_LT)
    for ang in [-0.32, 0.32]:
        petal(-math.pi / 2 + ang, pr * 1.0, pr * 0.32, LOTUS_LT)

    # diya bowl resting in the lotus
    bw, bh = pr * 0.95, pr * 0.4
    by = cy - pr * 0.08
    d.ellipse([cx - bw, by - bh * 0.2, cx + bw, by + bh * 1.5], fill=BOWL_DK)
    d.ellipse([cx - bw, by - bh * 0.6, cx + bw, by + bh * 0.8], fill=BOWL)
    d.ellipse([cx - bw * 0.8, by - bh * 0.4, cx + bw * 0.8, by + bh * 0.5], fill=(235, 200, 130))

    img.alpha_composite(layer)

    # flame (glowing) on its own layer above the halo
    fl = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fl)
    fx, fy = cx, by - pr * 0.1
    fh = pr * 0.7
    fd.polygon([(fx, fy - fh), (fx + fh * 0.32, fy - fh * 0.2), (fx, fy + fh * 0.1), (fx - fh * 0.32, fy - fh * 0.2)], fill=FLAME)
    fd.polygon([(fx, fy - fh * 0.7), (fx + fh * 0.16, fy - fh * 0.15), (fx, fy + fh * 0.02), (fx - fh * 0.16, fy - fh * 0.15)], fill=FLAME_HOT)
    img.alpha_composite(fl)
    return img


def render(out_size, scale, maskable=False):
    S = out_size * SS
    img = make_base(S)
    if not maskable:
        img = draw_moon(img, S, scale)
    img = draw_lotus_diya(img, S, scale)
    img = img.resize((out_size, out_size), Image.LANCZOS).convert("RGB")
    return img


render(512, 1.0).save(os.path.join(HERE, "icon-512.png"))
render(192, 1.0).save(os.path.join(HERE, "icon-192.png"))
render(180, 1.0).save(os.path.join(HERE, "icon-180.png"))
render(512, 0.72, maskable=True).save(os.path.join(HERE, "icon-maskable-512.png"))

# a crisp SVG icon
svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#18164a"/><stop offset="100%" stop-color="#0a0a24"/>
    </radialGradient>
    <radialGradient id="halo" cx="50%" cy="56%" r="40%">
      <stop offset="0%" stop-color="#fff3c8" stop-opacity="0.85"/><stop offset="100%" stop-color="#fff3c8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <rect width="512" height="512" rx="96" fill="url(#halo)"/>
  <circle cx="368" cy="120" r="40" fill="#ecf2ff"/>
  <circle cx="392" cy="106" r="40" fill="#0a0a24"/>
  <g transform="translate(256,320)">
    <g fill="#ff96c0">
      <ellipse cx="0" cy="-30" rx="22" ry="60"/>
      <ellipse cx="-46" cy="-14" rx="20" ry="52" transform="rotate(-32 -46 -14)"/>
      <ellipse cx="46" cy="-14" rx="20" ry="52" transform="rotate(32 46 -14)"/>
      <ellipse cx="-84" cy="6" rx="18" ry="44" transform="rotate(-58 -84 6)"/>
      <ellipse cx="84" cy="6" rx="18" ry="44" transform="rotate(58 84 6)"/>
    </g>
    <ellipse cx="0" cy="6" rx="78" ry="30" fill="#7a4a16"/>
    <ellipse cx="0" cy="0" rx="78" ry="26" fill="#caa24a"/>
    <path d="M0 -64 C 26 -28 18 -10 0 -2 C -18 -10 -26 -28 0 -64 Z" fill="#ffa83c"/>
    <path d="M0 -50 C 14 -24 10 -12 0 -6 C -10 -12 -14 -24 0 -50 Z" fill="#fff6d6"/>
  </g>
</svg>'''
open(os.path.join(HERE, "icon.svg"), "w").write(svg)
print("icons written:", sorted(os.listdir(HERE)))
