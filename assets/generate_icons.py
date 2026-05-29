#!/usr/bin/env python3
"""Generate Divya Gatha PWA icons: a golden bow & arrow over a haloed
dawn-gradient tile. Rendered at 4x then downscaled (LANCZOS) for smoothness."""
import math, os
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SS = 4  # supersample

INDIGO = (36, 26, 82)
MID = (108, 79, 142)
SAFFRON = (239, 138, 44)
GOLD = (255, 209, 74)
GOLDLT = (255, 243, 176)
STRING = (255, 250, 230)
ARROWHEAD = (228, 236, 245)
BROWN = (122, 61, 12)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_base(S):
    img = Image.new("RGB", (S, S))
    d = ImageDraw.Draw(img)
    for y in range(S):
        t = y / S
        if t < 0.6:
            col = lerp(INDIGO, MID, t / 0.6)
        else:
            col = lerp(MID, SAFFRON, (t - 0.6) / 0.4)
        d.line([(0, y), (S, y)], fill=col)
    # radial gold glow (halo) behind emblem
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy, R = S * 0.5, S * 0.44, S * 0.42
    steps = int(R)
    for i in range(steps, 0, -1):
        t = i / steps
        a = int(150 * (1 - t) ** 1.7)
        r = R * t
        gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GOLDLT + (a,))
    glow = glow.filter(ImageFilter.GaussianBlur(S * 0.02))
    img = img.convert("RGBA")
    img.alpha_composite(glow)
    return img


def draw_emblem(img, S, scale):
    cx, cy = S * 0.5, S * 0.46
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    R = S * 0.30 * scale
    bw = max(2, int(S * 0.045 * scale))
    bbox = [cx - R, cy - R, cx + R, cy + R]
    # bow: left arc, opening to the right
    d.arc(bbox, 118, 242, fill=GOLD, width=bw)
    d.arc([cx - R + bw * 0.3, cy - R + bw * 0.3, cx + R - bw * 0.3, cy + R - bw * 0.3], 118, 242, fill=GOLDLT, width=max(1, bw // 3))
    a1, a2 = math.radians(118), math.radians(242)
    t1 = (cx + R * math.cos(a1), cy + R * math.sin(a1))
    t2 = (cx + R * math.cos(a2), cy + R * math.sin(a2))
    nock = (cx - R * 0.12, cy)
    # string
    d.line([t1, nock, t2], fill=STRING, width=max(2, int(S * 0.012 * scale)))
    # arrow shaft
    tip = (cx + R * 1.18, cy)
    d.line([nock, tip], fill=BROWN, width=max(3, int(S * 0.026 * scale)))
    d.line([nock, tip], fill=GOLD, width=max(1, int(S * 0.010 * scale)))
    # arrowhead
    hl = R * 0.22
    d.polygon([(tip[0] + hl * 0.4, cy), (tip[0] - hl * 0.5, cy - hl * 0.5), (tip[0] - hl * 0.5, cy + hl * 0.5)], fill=ARROWHEAD)
    # fletching
    fl = R * 0.2
    d.polygon([nock, (nock[0] - fl, cy - fl * 0.6), (nock[0] - fl * 0.4, cy)], fill=(226, 59, 59))
    d.polygon([nock, (nock[0] - fl, cy + fl * 0.6), (nock[0] - fl * 0.4, cy)], fill=(226, 59, 59))

    # sparkles
    def spark(x, y, s, col):
        d.polygon([(x, y - s), (x + s * 0.28, y - s * 0.28), (x + s, y), (x + s * 0.28, y + s * 0.28),
                   (x, y + s), (x - s * 0.28, y + s * 0.28), (x - s, y), (x - s * 0.28, y - s * 0.28)], fill=col)
    spark(cx + R * 0.95, cy - R * 0.9, S * 0.03 * scale, GOLDLT)
    spark(cx - R * 0.8, cy + R * 0.85, S * 0.022 * scale, GOLDLT)
    spark(cx + R * 1.05, cy + R * 0.55, S * 0.016 * scale, GOLDLT)

    img.alpha_composite(layer)
    return img


def render(out_size, scale, maskable=False):
    S = out_size * SS
    img = make_base(S)
    img = draw_emblem(img, S, scale)
    img = img.resize((out_size, out_size), Image.LANCZOS).convert("RGB")
    return img


render(512, 0.92).save(os.path.join(HERE, "icon-512.png"))
render(192, 0.92).save(os.path.join(HERE, "icon-192.png"))
render(180, 0.92).save(os.path.join(HERE, "icon-180.png"))
render(512, 0.66, maskable=True).save(os.path.join(HERE, "icon-maskable-512.png"))
print("icons written:", os.listdir(HERE))
