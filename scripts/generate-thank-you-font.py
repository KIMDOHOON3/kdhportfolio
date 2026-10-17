"""Extract only the footer glyphs from the portfolio's existing NewYork font.

Run with Python + fonttools==4.67.0. The generated JSON is consumed by Three.js
FontLoader; no font conversion or Python dependency runs in the browser.
"""
import argparse
import json
from pathlib import Path

from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--font", default="public/font/NewYork.woff")
parser.add_argument("--text", default="THANK YOU")
parser.add_argument("--output", default="src/app/components/portfolio/thankYouFont.json")
parser.add_argument("--woff2")
args = parser.parse_args()
font = TTFont(root / args.font)
glyph_set = font.getGlyphSet()


class ThreeOutline(BasePen):
    def __init__(self):
        super().__init__(glyph_set)
        self.commands = []
        self.start = None

    def command(self, kind, *points):
        self.commands.append(kind)
        self.commands.extend(str(round(v, 3)) for point in points for v in point)

    def _moveTo(self, point):
        self.start = point
        self.command("m", point)

    def _lineTo(self, point):
        self.command("l", point)

    def _curveToOne(self, control1, control2, end):
        self.command("b", end, control1, control2)

    def _qCurveToOne(self, control, end):
        self.command("q", end, control)

    def _closePath(self):
        self.command("l", self.start)

    def _endPath(self):
        pass


glyphs = {}
for character in sorted(set(args.text)):
    name = font.getBestCmap()[ord(character)]
    pen = ThreeOutline()
    glyph_set[name].draw(pen)
    bounds = BoundsPen(glyph_set)
    glyph_set[name].draw(bounds)
    glyphs[character] = {
        "ha": font["hmtx"][name][0],
        "x_min": bounds.bounds[0] if bounds.bounds else 0,
        "x_max": bounds.bounds[2] if bounds.bounds else 0,
        "o": " ".join(pen.commands),
    }
head, hhea, post = font["head"], font["hhea"], font["post"]
data = {
    "glyphs": glyphs,
    "familyName": font["name"].getDebugName(1),
    "ascender": hhea.ascent,
    "descender": hhea.descent,
    "underlinePosition": post.underlinePosition,
    "underlineThickness": post.underlineThickness,
    "boundingBox": {key: getattr(head, key) for key in ("xMin", "xMax", "yMin", "yMax")},
    "resolution": head.unitsPerEm,
    "original_font_information": {"source": args.font},
}
target = root / args.output
target.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {len(glyphs)} glyphs, {target.stat().st_size} bytes")
if args.woff2:
    from fontTools import subset

    subsetter = subset.Subsetter()
    subsetter.populate(text=args.text)
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(root / args.woff2)
    print(f"Wrote {args.woff2}")
