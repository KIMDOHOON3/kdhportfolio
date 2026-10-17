// Build genuinely convex glass caps from the portfolio's existing NewYork
// outlines. Run with `node scripts/generate-rounded-thank-you.mjs`.
// Generation is offline; the browser only loads the indexed GLB geometry.
import fs from "node:fs";
import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { TessellateModifier } from "three/addons/modifiers/TessellateModifier.js";
import {
  mergeVertices,
  mergeGeometries,
} from "three/addons/utils/BufferGeometryUtils.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }
};
const root = new URL("../", import.meta.url);
const font = new FontLoader().parse(
  JSON.parse(
    fs.readFileSync(
      new URL("src/app/components/portfolio/thankYouFont.json", root),
      "utf8",
    ),
  ),
);
const scene = new THREE.Scene();
const metrics = [];
for (const word of ["THANK", "YOU"]) {
  const shapes = font.generateShapes(word, 1);
  const segments = [];
  for (const shape of shapes) {
    const { shape: contour, holes } = shape.extractPoints(18);
    for (const points of [contour, ...holes])
      for (let i = 0; i < points.length; i++) {
        const a = points[i],
          b = points[(i + 1) % points.length];
        const dx = b.x - a.x,
          dy = b.y - a.y;
        if (dx * dx + dy * dy > 1e-12)
          segments.push([a.x, a.y, dx, dy, dx * dx + dy * dy]);
      }
  }
  const base = new TextGeometry(word, {
    font,
    size: 1,
    depth: 0.1,
    curveSegments: 18,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.085,
    bevelSegments: 12,
  });
  base.deleteAttribute("normal");
  base.deleteAttribute("uv");
  const sections = base.groups.map((group) => {
    const section = new THREE.BufferGeometry();
    section.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        base
          .getAttribute("position")
          .array.slice(group.start * 3, (group.start + group.count) * 3),
        3,
      ),
    );
    // Only the caps need an interior grid. The twelve bevel rings already
    // describe smooth side curvature; subdividing them wastes most vertices.
    return group.materialIndex === 0
      ? new TessellateModifier(0.035, 12).modify(section)
      : section;
  });
  const dense = mergeGeometries(sections);
  const position = dense.getAttribute("position");
  const cache = new Map();
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i),
      y = position.getY(i),
      z = position.getZ(i) - 0.05;
    const key = `${x.toFixed(6)},${y.toFixed(6)}`;
    let height = cache.get(key);
    if (height === undefined) {
      let minimum = Infinity;
      for (const [ax, ay, dx, dy, length] of segments) {
        const t = Math.max(
          0,
          Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length),
        );
        const distance = Math.hypot(x - ax - t * dx, y - ay - t * dy);
        minimum = Math.min(minimum, distance);
      }
      height =
        0.045 * (0.5 - 0.5 * Math.cos(Math.min(1, minimum / 0.045) * Math.PI));
      cache.set(key, height);
    }
    // Both faces bulge, unlike the flat front of a conventional extrusion.
    const cap = Math.abs(z) > 0.1349;
    position.setZ(i, cap ? z + Math.sign(z) * height : z);
  }
  const geometry = mergeVertices(dense, 1e-5);
  geometry.computeVertexNormals();
  // Remove small triangulation changes from the reflected softbox contours.
  // Smoothing normals leaves the original letter outline and mesh volume intact.
  const normals = geometry.getAttribute("normal");
  const indices = geometry.index.array;
  for (let pass = 0; pass < 2; pass++) {
    const sums = new Float32Array(normals.array.length);
    const weights = new Uint16Array(normals.count);
    for (let i = 0; i < indices.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        const a = indices[i + k];
        for (let j = 0; j < 3; j++) {
          const b = indices[i + j];
          if (a === b) continue;
          for (let c = 0; c < 3; c++)
            sums[a * 3 + c] += normals.array[b * 3 + c];
          weights[a]++;
        }
      }
    }
    const normal = new THREE.Vector3();
    for (let i = 0; i < normals.count; i++) {
      normal.fromBufferAttribute(normals, i).multiplyScalar(weights[i] || 1);
      normal.add(new THREE.Vector3().fromArray(sums, i * 3)).normalize();
      normals.setXYZ(i, normal.x, normal.y, normal.z);
    }
  }
  geometry.center();
  geometry.computeBoundingBox();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  mesh.name = word;
  scene.add(mesh);
  metrics.push({
    word,
    vertices: geometry.getAttribute("position").count,
    triangles: geometry.index.count / 3,
    size: geometry.boundingBox.getSize(new THREE.Vector3()).toArray(),
  });
  base.dispose();
  dense.dispose();
  sections.forEach((section) => section.dispose());
}
const buffer = await new GLTFExporter().parseAsync(scene, { binary: true });
fs.mkdirSync(new URL("public/models/", root), { recursive: true });
fs.writeFileSync(
  new URL("public/models/thank-you-rounded.glb", root),
  Buffer.from(buffer),
);
console.log(JSON.stringify({ bytes: buffer.byteLength, metrics }, null, 2));
