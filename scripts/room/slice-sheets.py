"""
Cut the room item sheets (black-outlined drawings on a light background) into
separate transparent WebP images for public/room/.

  python scripts/room/slice-sheets.py <sheets-dir>

The background is removed by flood-filling light pixels in from the edges, so
it stops at each drawing's dark outline (white parts inside a drawing stay).
Each sheet lists how many items it holds, left→right then top→bottom.
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

SRC = sys.argv[1]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'public', 'room')

# sheet file -> (category, ids in reading order, rows)
SHEETS = {
    '9.webp':  ('bowl',   ['full', 'empty', 'three', 'one', 'pile'], [5]),
    '10.webp': ('chair',  ['paw', 'stripe', 'gingham', 'fluffy', 'stitch'], [5]),
    '11.webp': ('chair',  ['black', 'white', 'paw-ears', 'plaid', 'cloud'], [5]),
    '12.webp': ('desk',   ['study', 'gamer', 'pegboard', 'laptop', 'artist'], [5]),
    '13.webp': ('desk',   ['notebook', 'coffee', 'night', 'cozy', 'lucky'], [5]),
    '14.webp': ('shelf',  ['books-camera', 'lucky-cat', 'globe', 'clock', 'moon-cat'], [2, 3]),
    '16.webp': ('shelf',  ['lantern', 'photo', 'sleepy', 'butterfly', 'moonlamp'], [3, 2]),
    '17.webp': ('shelf',  ['trailing', 'fairy', 'atlas', 'snapshot', 'dreamy'], [3, 2]),
    '18.webp': ('shelf',  ['vines', 'starlight', 'explorer', 'hexagon', 'cloud'], [2, 3]),
    '19.webp': ('rug',    ['cloud', 'saturn', 'paw', 'book', 'checker-wave'], [3, 2]),
    '20.webp': ('rug',    ['fluffy', 'black-paw', 'moon', 'cat-face', 'checker'], [3, 2]),
    '21.webp': ('window', ['shutters', 'stars', 'blind-rain', 'nook', 'arch-vine'], [3, 2]),
    '22.webp': ('window', ['curtain', 'blinds', 'storm', 'vine', 'fairy-lights'], [3, 2]),
    '23.webp': ('bed',    ['paw', 'house', 'bookcase', 'cloud-moon', 'music'], [3, 2]),
    '24.webp': ('bed',    ['cat-ears', 'cloud', 'neon', 'canopy', 'cat-cave'], [3, 2]),
    '15.webp': ('hud',    ['plaque', 'history', 'xp', 'settings'], 2),
}

def cutout(img, thresh=165):
    a = np.asarray(img.convert('RGB')).astype(np.int16)
    light = a.min(axis=2) >= thresh            # near-white / light grey (floor lines, shadows)
    h, w = light.shape
    pad = np.ones((h + 2, w + 2), bool); pad[1:-1, 1:-1] = light
    lab, _ = ndimage.label(pad)
    bg = (lab == lab[0, 0])[1:-1, 1:-1]       # light pixels connected to the border
    return ~bg

def items(mask, count, rows):
    # merge nearby pieces (leaves, fairy lights) into one blob per drawing
    grown = ndimage.binary_dilation(mask, iterations=14)
    lab, n = ndimage.label(grown)
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
    keep = sorted(range(1, n + 1), key=lambda i: -sizes[i - 1])[:count]
    boxes = []
    for i in keep:
        ys, xs = np.where(lab == i)
        boxes.append((i, xs.min(), ys.min(), xs.max(), ys.max()))
    # reading order: row by vertical centre, then x
    h = mask.shape[0]
    def key(b):
        cy = (b[2] + b[4]) / 2
        row = int(cy / (h / rows)) if rows > 1 else 0
        return (row, b[1])
    return sorted(boxes, key=key), lab

def split(occ, n, min_gap=3):
    """Split a 1D occupancy profile into n parts at the n-1 widest empty gaps."""
    idx = np.where(occ)[0]
    if n <= 1 or not len(idx): return [(idx.min(), idx.max())] if len(idx) else []
    gaps = []
    start = None
    for i in range(idx.min(), idx.max() + 1):
        if not occ[i]:
            if start is None: start = i
        elif start is not None:
            if i - start >= min_gap: gaps.append((i - start, start, i))
            start = None
    cuts = sorted(sorted(gaps, reverse=True)[:n - 1], key=lambda g: g[1])
    parts, lo = [], idx.min()
    for _, a, b in cuts: parts.append((lo, a - 1)); lo = b
    parts.append((lo, idx.max()))
    return parts

def grid_items(mask, layout):
    """Boxes in reading order for a sheet with layout = items per row."""
    clean = ndimage.binary_opening(mask, iterations=1)
    if len(layout) == 2:
        # cut between the rows where the fewest pixels are drawn (hanging vines can bridge the gap)
        h = mask.shape[0]
        prof = clean.sum(axis=1)
        lo, hi = int(h * 0.35), int(h * 0.68)
        cut = lo + int(np.argmin(prof[lo:hi]))
        ys = np.where(clean.any(axis=1))[0]
        rows = [(ys.min(), cut), (cut + 1, ys.max())]
    else:
        rows = split(clean.any(axis=1), len(layout), 2)
    out = []
    for (y0, y1), n in zip(rows, layout):
        band = clean[y0:y1 + 1]
        parts = split(band.any(axis=0), n, 2)
        # touching neighbours: cut the widest part at its thinnest column until there are n
        while len(parts) < n:
            k = max(range(len(parts)), key=lambda i: parts[i][1] - parts[i][0])
            a, b = parts[k]
            prof = band[:, a:b + 1].sum(axis=0)
            m = int(len(prof) * 0.3) + int(np.argmin(prof[int(len(prof) * 0.3):int(len(prof) * 0.7)]))
            parts[k:k + 1] = [(a, a + m - 1), (a + m + 1, b)]
        for x0, x1 in parts:
            sub = mask[y0:y1 + 1, x0:x1 + 1]
            ys, xs = np.where(sub)
            out.append((x0 + xs.min(), y0 + ys.min(), x0 + xs.max(), y0 + ys.max()))
    return out

def main():
    os.makedirs(OUT, exist_ok=True)
    meta = {}
    for fname, (cat, ids, rows) in SHEETS.items():
        img = Image.open(os.path.join(SRC, fname)).convert('RGB')
        mask = cutout(img)
        if cat == 'rug':
            mask[:265] = False  # the skirting line drawn behind the rugs
        if isinstance(rows, list):
            boxes = grid_items(mask, rows)
            regions = []
            for x0, y0, x1, y1 in boxes:
                r = np.zeros_like(mask); r[y0:y1 + 1, x0:x1 + 1] = mask[y0:y1 + 1, x0:x1 + 1]
                regions.append((r, x0, y0, x1, y1))
        else:
            bx, lab = items(mask, len(ids), rows)
            regions = [((lab == li) & mask, x0, y0, x1, y1) for li, x0, y0, x1, y1 in bx]
        if len(regions) != len(ids):
            print('WARN', fname, 'found', len(regions), 'expected', len(ids))
        for (m, x0, y0, x1, y1), id_ in zip(regions, ids):
            alpha = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))
            rgba = img.copy(); rgba.putalpha(alpha)
            pad = 4
            crop = rgba.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))
            bbox = crop.getbbox()
            if bbox: crop = crop.crop(bbox)
            os.makedirs(os.path.join(OUT, cat), exist_ok=True)
            crop.save(os.path.join(OUT, cat, f'{id_}.webp'), 'WEBP', quality=88, method=4)
            meta.setdefault(cat, {})[id_] = [crop.width, crop.height]
            print(cat, id_, crop.size)
    # Blank the drawn crown and XP bar: the page draws live hearts, level and XP there.
    for name, rect in (('plaque', (92, 278, 290, 458)), ('xp', (58, 146, 882, 246))):
        path = os.path.join(OUT, 'hud', f'{name}.webp')
        im = Image.open(path).convert('RGBA')
        ImageDraw.Draw(im).rectangle(rect, fill=(248, 248, 248, 255))
        im.save(path, 'WEBP', quality=88, method=4)
    bg = Image.open(os.path.join(SRC, '8.webp')).convert('RGB')
    bg.save(os.path.join(OUT, 'background.webp'), 'WEBP', quality=86, method=6)

main()
