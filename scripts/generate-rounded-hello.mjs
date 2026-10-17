// Offline fused, rounded HELLO surface. Run: node scripts/generate-rounded-hello.mjs
// Read only the numeric path data; never evaluate the application source.
import fs from "node:fs";
import { parseArgs } from "node:util";
import * as THREE from "three";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
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
const source = fs.readFileSync(
  new URL("src/app/components/portfolio/GlassScene.tsx", root),
  "utf8",
);
const declaration = source.slice(
  source.indexOf("const strokes:"),
  source.indexOf("export default"),
);
const arrayText = declaration
  .slice(declaration.indexOf("=") + 1)
  .trim()
  .replace(/;\s*$/, "");
const strokes = JSON.parse(arrayText.replace(/,\s*([\]}])/g, "$1"));
if (
  !Array.isArray(strokes) ||
  strokes.length !== 5 ||
  strokes.some(
    (stroke) =>
      !Array.isArray(stroke) ||
      stroke.some(
        (point) =>
          !Array.isArray(point) ||
          point.length !== 2 ||
          point.some((value) => !Number.isFinite(value)),
      ),
  )
) {
  throw new Error("Expected five numeric HELLO stroke arrays.");
}

const { values: options } = parseArgs({
  options: {
    radius: { type: "string", default: "0.35" },
    output: { type: "string", default: "public/models/hello-rounded.glb" },
  },
});
const radius = Number(options.radius);
if (!Number.isFinite(radius) || radius <= 0)
  throw new Error("Radius must be positive.");
const letterSpacing = 0.72;
const blend = 0.1;
const resolution = 256;
const smoothingPasses = 3;
const maxPolygons = 200000;
const samples = 180;
// Preserve the original baseline/endpoints, but open the tight handwritten
// counters before inflating the curves. Thicker tubing alone fills these eyes.
const counterStrokes = strokes.map((stroke, index) =>
  stroke.map(([x, y], i) => {
    if (index === 2 || index === 3) {
      const offsets = { 1: 0.37, 2: 0.12, 4: -0.35, 5: -0.32 };
      x += offsets[i] ?? 0;
      // Keep the widened neighboring loops separate above their shared baseline.
      if (index === 3) x += 0.5 * Math.min(1, Math.max(0, y / 0.75));
    } else if (index === 1) {
      if (i === 2) x += 0.2;
      if (i === 3) y += 0.3;
      if (i === 4) x -= 0.15;
    }
    return [x, y];
  }),
);
const curves = counterStrokes.map(
  (stroke, index) =>
    new THREE.CatmullRomCurve3(
      stroke.map(
        ([x, y], i) =>
          new THREE.Vector3(
            x + index * letterSpacing,
            y,
            Math.sin(i * 0.75 + index) * 0.075,
          ),
      ),
      false,
      "centripetal",
    ),
);
const letterPaths = curves.map((curve) => curve.getPoints(samples));
// Adjacent letters used to touch only where their inflated end caps overlapped.
// Give the handwriting actual connecting centerlines, with tangents that carry
// the exit stroke into the next letter instead of leaving a pinched junction.
const joins = curves.slice(0, -1).map((curve, index) => {
  const next = curves[index + 1];
  const start = curve.getPoint(1);
  let entry = 0;
  if (index === 3) {
    // The o starts at its upper right for the loop construction. Join its left
    // entry, not that distant start or the decorative right-hand exit stroke.
    let nearest = Infinity;
    letterPaths[index + 1].forEach((point, sample) => {
      const distance = start.distanceToSquared(point);
      if (distance < nearest) {
        nearest = distance;
        entry = sample / samples;
      }
    });
  }
  const end = next.getPoint(entry);
  const handle = start.distanceTo(end) * 0.28;
  const direction = end.clone().sub(start).normalize();
  const incoming = curve.getTangent(1);
  // At the side of the o the authored loop can run against the joining stroke.
  // Use its geometric tangent in the direction of travel through this join.
  const outgoing = next.getTangent(entry);
  if (outgoing.dot(direction) < 0) outgoing.negate();
  return new THREE.CubicBezierCurve3(
    start,
    start.clone().addScaledVector(incoming, handle),
    end.clone().addScaledVector(outgoing, -handle),
    end,
  );
});
const joinPaths = joins.map((curve) => curve.getPoints(32));
const paths = [...letterPaths, ...joinPaths];
const pointBounds = new THREE.Box3().setFromPoints(paths.flat());
const center = pointBounds.getCenter(new THREE.Vector3());
const span =
  pointBounds.getSize(new THREE.Vector3()).x + 2 * (radius + blend + 0.2);
const half = span / 2;
const step = span / resolution;
const origin = center.clone().addScalar(-half);
const size2 = resolution * resolution;
const marcher = new MarchingCubes(
  resolution,
  new THREE.MeshStandardMaterial(),
  false,
  false,
  maxPolygons,
);
marcher.isolation = 0;
marcher.field.fill(-1);
const support = radius + blend + 2 * step;
const curveField = new Float32Array(marcher.field.length);
const grid = (value, axis) => (value - origin[axis]) / step;

for (const points of paths) {
  curveField.fill(-1);
  for (let segment = 0; segment < points.length - 1; segment++) {
    const a = points[segment],
      b = points[segment + 1];
    const dx = b.x - a.x,
      dy = b.y - a.y,
      dz = b.z - a.z;
    const length2 = dx * dx + dy * dy + dz * dz;
    const x0 = Math.max(1, Math.floor(grid(Math.min(a.x, b.x) - support, "x")));
    const x1 = Math.min(
      resolution - 2,
      Math.ceil(grid(Math.max(a.x, b.x) + support, "x")),
    );
    const y0 = Math.max(1, Math.floor(grid(Math.min(a.y, b.y) - support, "y")));
    const y1 = Math.min(
      resolution - 2,
      Math.ceil(grid(Math.max(a.y, b.y) + support, "y")),
    );
    const z0 = Math.max(1, Math.floor(grid(Math.min(a.z, b.z) - support, "z")));
    const z1 = Math.min(
      resolution - 2,
      Math.ceil(grid(Math.max(a.z, b.z) + support, "z")),
    );
    for (let z = z0; z <= z1; z++) {
      const pz = origin.z + z * step - a.z;
      for (let y = y0; y <= y1; y++) {
        const py = origin.y + y * step - a.y;
        let index = z * size2 + y * resolution + x0;
        for (let x = x0; x <= x1; x++, index++) {
          const px = origin.x + x * step - a.x;
          const t =
            length2 > 0
              ? Math.max(
                  0,
                  Math.min(1, (px * dx + py * dy + pz * dz) / length2),
                )
              : 0;
          const value =
            radius - Math.hypot(px - t * dx, py - t * dy, pz - t * dz);
          if (value > curveField[index]) curveField[index] = value;
        }
      }
    }
  }
  // Polynomial smooth maximum fuses separate paths while preserving the outline
  // wherever the neighboring stroke lies more than blend units away.
  for (let i = 0; i < marcher.field.length; i++) {
    const a = marcher.field[i],
      b = curveField[i];
    const h = Math.max(0, blend - Math.abs(a - b)) / blend;
    marcher.field[i] = Math.max(a, b) + h * h * blend * 0.25;
  }
}
// Close sub-cell fissures at near-tangent joins before extraction. A single
// grid-cell scalar closing removes accidental pinholes while retaining the
// deliberately widened counters. Work separably to keep the offline pass small.
// Round the e/l junction locally to seal its accidental interstitial pinhole.
// This short depth capsule stays inside that join and leaves all four intended
// counters open; it does not alter the original baseline endpoints.
for (let z = 1; z < resolution - 1; z++) {
  const pz = origin.z + z * step;
  if (Math.abs(pz) > 0.5) continue;
  for (let y = 1; y < resolution - 1; y++) {
    const py = origin.y + y * step - 0.2;
    if (Math.abs(py) > 0.35) continue;
    for (let x = 1; x < resolution - 1; x++) {
      const px = origin.x + x * step + 1.15;
      if (Math.abs(px) > 0.35) continue;
      const index = z * size2 + y * resolution + x;
      const b =
        0.18 - Math.hypot(px, py, pz - Math.max(-0.18, Math.min(0.18, pz)));
      const a = marcher.field[index];
      const h = Math.max(0, blend - Math.abs(a - b)) / blend;
      marcher.field[index] = Math.max(a, b) + h * h * blend * 0.25;
    }
  }
}
let filtered = marcher.field;
for (const maximum of [true, false]) {
  for (const stride of [1, resolution, size2]) {
    const next = filtered.slice();
    for (let z = 1; z < resolution - 1; z++) {
      for (let y = 1; y < resolution - 1; y++) {
        let i = z * size2 + y * resolution + 1;
        for (let x = 1; x < resolution - 1; x++, i++) {
          next[i] = maximum
            ? Math.max(filtered[i - stride], filtered[i], filtered[i + stride])
            : Math.min(filtered[i - stride], filtered[i], filtered[i + stride]);
        }
      }
    }
    filtered = next;
  }
}
// Closing seals tiny gaps but its axis-aligned extrema can leave ridges in
// reflections. Filter the scalar surface before extraction, so both geometry
// and its gradient normals describe the same rounded, continuous surface.
for (let pass = 0; pass < smoothingPasses; pass++) {
  for (const stride of [1, resolution, size2]) {
    const next = filtered.slice();
    for (let z = 1; z < resolution - 1; z++) {
      for (let y = 1; y < resolution - 1; y++) {
        let i = z * size2 + y * resolution + 1;
        for (let x = 1; x < resolution - 1; x++, i++) {
          next[i] =
            (filtered[i - stride] + 2 * filtered[i] + filtered[i + stride]) *
            0.25;
        }
      }
    }
    filtered = next;
  }
}
marcher.field.set(filtered);
marcher.update();
if (marcher.count / 3 >= maxPolygons)
  throw new Error("Marching cubes buffer limit reached.");

const raw = new THREE.BufferGeometry();
const positions = marcher.geometry
  .getAttribute("position")
  .array.slice(0, marcher.count * 3);
for (let i = 0; i < positions.length; i += 3) {
  positions[i] = positions[i] * half + center.x;
  positions[i + 1] = positions[i + 1] * half + center.y;
  positions[i + 2] = positions[i + 2] * half + center.z;
}
raw.setAttribute("position", new THREE.BufferAttribute(positions, 3));
const geometry = mergeVertices(raw, 1e-5);
// A zero crossing almost on a grid corner can collapse a microscopic triangle
// during welding. Remove those triangles before checking surface topology.
const cleanIndices = [];
for (let i = 0; i < geometry.index.count; i += 3) {
  const a = geometry.index.array[i],
    b = geometry.index.array[i + 1],
    c = geometry.index.array[i + 2];
  if (a !== b && b !== c && c !== a) cleanIndices.push(a, b, c);
}
geometry.setIndex(cleanIndices);

// Interpolate the sampled field gradients for a smooth surface normal across
// cell boundaries. Original object coordinates remain unchanged in the GLB.
function sampleField(x, y, z) {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    iz = Math.floor(z);
  const fx = x - ix,
    fy = y - iy,
    fz = z - iz;
  let value = 0;
  for (let dz = 0; dz <= 1; dz++)
    for (let dy = 0; dy <= 1; dy++)
      for (let dx = 0; dx <= 1; dx++) {
        value +=
          marcher.field[(iz + dz) * size2 + (iy + dy) * resolution + ix + dx] *
          (dx ? fx : 1 - fx) *
          (dy ? fy : 1 - fy) *
          (dz ? fz : 1 - fz);
      }
  return value;
}
// Topological connectivity alone allowed visually weak, near-tangent contacts.
// The center of every connector must retain a substantial interior clearance
// after closing and smoothing, so the joining stroke cannot collapse to a seam.
const joinClearances = joins.map((curve) =>
  Math.min(
    ...curve
      .getPoints(24)
      .map((point) =>
        sampleField(grid(point.x, "x"), grid(point.y, "y"), grid(point.z, "z")),
      ),
  ),
);
if (joinClearances.some((clearance) => clearance < radius * 0.6)) {
  throw new Error(`Thin handwriting join: ${JSON.stringify(joinClearances)}`);
}
const position = geometry.getAttribute("position");
const normals = new Float32Array(position.count * 3);
const normal = new THREE.Vector3();
for (let i = 0; i < position.count; i++) {
  const x = grid(position.getX(i), "x"),
    y = grid(position.getY(i), "y"),
    z = grid(position.getZ(i), "z");
  normal
    .set(
      sampleField(x - 1, y, z) - sampleField(x + 1, y, z),
      sampleField(x, y - 1, z) - sampleField(x, y + 1, z),
      sampleField(x, y, z - 1) - sampleField(x, y, z + 1),
    )
    .normalize();
  normals.set(normal.toArray(), i * 3);
}
geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
let maximumNormalLengthError = 0;
for (let i = 0; i < position.count; i++) {
  const length = Math.hypot(
    normals[i * 3],
    normals[i * 3 + 1],
    normals[i * 3 + 2],
  );
  if (!Number.isFinite(length)) throw new Error("Non-finite surface normal.");
  maximumNormalLengthError = Math.max(
    maximumNormalLengthError,
    Math.abs(length - 1),
  );
}
if (maximumNormalLengthError > 0.00001)
  throw new Error("Surface normals are not unit length.");
geometry.computeBoundingBox();
geometry.computeBoundingSphere();

// Verify the exported surface is closed and connected, including round ends.
const edges = new Map();
const edgeDirections = new Map();
const parent = Int32Array.from({ length: position.count }, (_, i) => i);
const find = (index) => {
  while (parent[index] !== index) {
    parent[index] = parent[parent[index]];
    index = parent[index];
  }
  return index;
};
const indices = geometry.index.array;
let signedVolume = 0;
const va = new THREE.Vector3(),
  vb = new THREE.Vector3(),
  vc = new THREE.Vector3();
const faceNormal = new THREE.Vector3();
for (let i = 0; i < indices.length; i += 3) {
  va.fromBufferAttribute(position, indices[i]);
  vb.fromBufferAttribute(position, indices[i + 1]);
  vc.fromBufferAttribute(position, indices[i + 2]);
  signedVolume += va.dot(faceNormal.crossVectors(vb, vc)) / 6;
  for (let j = 0; j < 3; j++) {
    const a = indices[i + j],
      b = indices[i + ((j + 1) % 3)];
    const edge = a < b ? `${a},${b}` : `${b},${a}`;
    edges.set(edge, (edges.get(edge) ?? 0) + 1);
    edgeDirections.set(
      edge,
      (edgeDirections.get(edge) ?? 0) + (a < b ? 1 : -1),
    );
    parent[find(a)] = find(b);
  }
}
const boundaryEdges = [...edges.values()].filter((count) => count === 1).length;
const nonManifoldEdges = [...edges.values()].filter(
  (count) => count > 2,
).length;
const components = new Set([...parent.keys()].map(find)).size;
const eulerCharacteristic = position.count - edges.size + indices.length / 3;
const throughTunnels = (2 * components - eulerCharacteristic) / 2;
if (boundaryEdges || nonManifoldEdges || components !== 1) {
  throw new Error(
    `Surface validation failed: ${JSON.stringify({ boundaryEdges, nonManifoldEdges, components })}`,
  );
}
if (throughTunnels !== 4) {
  throw new Error(
    `Expected exactly the four e/l/l/o counters, found ${throughTunnels} tunnels.`,
  );
}
const inconsistentEdges = [...edgeDirections.values()].filter(
  (direction) => direction !== 0,
).length;
if (!(signedVolume > 0) || inconsistentEdges) {
  throw new Error(
    `Surface orientation failed: ${JSON.stringify({ signedVolume, inconsistentEdges })}`,
  );
}
const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
mesh.name = "HELLO";
const scene = new THREE.Scene();
scene.add(mesh);
const buffer = await new GLTFExporter().parseAsync(scene, { binary: true });
const output = new URL(options.output, root);
fs.mkdirSync(new URL("public/models/", root), { recursive: true });
fs.writeFileSync(output, Buffer.from(buffer));
const bounds = geometry.boundingBox;
const size = bounds.getSize(new THREE.Vector3());
console.log(
  JSON.stringify(
    {
      output: output.pathname,
      resolution,
      smoothingPasses,
      samples,
      radius,
      letterSpacing,
      blend,
      joins: joins.length,
      joinClearances,
      vertices: position.count,
      triangles: indices.length / 3,
      bytes: buffer.byteLength,
      bounds: {
        min: bounds.min.toArray(),
        max: bounds.max.toArray(),
        size: size.toArray(),
      },
      aspect: size.x / size.y,
      boundaryEdges,
      nonManifoldEdges,
      components,
      eulerCharacteristic,
      throughTunnels,
      signedVolume,
      inconsistentEdges,
      maximumNormalLengthError,
    },
    null,
    2,
  ),
);
raw.dispose();
geometry.dispose();
marcher.geometry.dispose();
marcher.material.dispose();
