"""Accent-area check for 19장: share of screen pixels that read as an accent colour.

A pixel counts as accent when it is clearly chromatic (the neutrals in 2-3 are all
near-grey) and close in hue to one of the four accents. Glow halos count too.
usage: python3 tools/accent.py shot.png [more.png ...]
"""
import sys
import colorsys
from PIL import Image

ACCENTS = {
    'cyan #45D6E9': (0x45, 0xD6, 0xE9),
    'lime #C3F56B': (0xC3, 0xF5, 0x6B),
    'red #FF5757': (0xFF, 0x57, 0x57),
    'gold #E5BA68': (0xE5, 0xBA, 0x68),
}
HUES = {k: colorsys.rgb_to_hsv(*(c / 255 for c in v))[0] for k, v in ACCENTS.items()}


def hue_dist(a, b):
    d = abs(a - b)
    return min(d, 1 - d)


for path in sys.argv[1:]:
    im = Image.open(path).convert('RGB')
    w, h = im.size
    px = im.load()
    counts = {k: 0 for k in ACCENTS}
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s < 0.28 or v < 0.22:
                continue
            best = min(HUES, key=lambda k: hue_dist(hh, HUES[k]))
            if hue_dist(hh, HUES[best]) < 0.06:
                counts[best] += 1
    total = w * h
    acc = sum(counts.values())
    print(f'{path}: accent {100 * acc / total:.2f}%  ' + '  '.join(f'{k.split()[0]} {100 * c / total:.2f}%' for k, c in counts.items()))
