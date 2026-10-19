// Recover the original writing order from the model's circular tube rings.
// Run at asset-build time: no topology traversal is shipped to the browser.
export function withFooterStroke(original) {
  const jsonLength = original.readUInt32LE(12);
  const json = JSON.parse(original.subarray(20, 20 + jsonLength).toString());
  const binary = original.subarray(28 + jsonLength);
  const strokes = [];
  const words = [];
  const read = (id, Type) => {
    const accessor = json.accessors[id];
    const view = json.bufferViews[accessor.bufferView];
    const offset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const size = accessor.type === "VEC3" ? 3 : 1;
    const bytes = binary.subarray(
      offset,
      offset + accessor.count * size * Type.BYTES_PER_ELEMENT,
    );
    return new Type(Uint8Array.from(bytes).buffer);
  };
  for (const mesh of json.meshes) {
    const primitive = mesh.primitives[0];
    const positions = read(primitive.attributes.POSITION, Float32Array);
    const count = positions.length / 3;
    const indices = read(
      primitive.indices,
      json.accessors[primitive.indices].componentType === 5123
        ? Uint16Array
        : Uint32Array,
    );
    const parent = Int32Array.from({ length: count }, (_, i) => i);
    const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    for (let i = 0; i < indices.length; i += 3) {
      const root = find(indices[i]);
      parent[find(indices[i + 1])] = root;
      parent[find(indices[i + 2])] = root;
    }
    const components = new Map();
    for (let i = 0; i < count; i++) {
      const root = find(i);
      const vertices = components.get(root) ?? [];
      vertices.push(i);
      components.set(root, vertices);
    }
    const progress = new Float32Array(count);
    const wordStrokes = [];
    words.push({ primitive, progress, strokes: wordStrokes });
    for (const vertices of components.values()) {
      const rings = (vertices.length - 2) / 24;
      if (!Number.isInteger(rings))
        throw new Error("Unexpected footer tube topology");
      const centers = [];
      const distance = [0];
      for (let r = 0; r < rings; r++) {
        const center = [0, 0, 0];
        for (let k = 0; k < 24; k++)
          for (let axis = 0; axis < 3; axis++)
            center[axis] += positions[vertices[r * 24 + k] * 3 + axis] / 24;
        if (r)
          distance.push(
            distance[r - 1] +
              Math.hypot(...center.map((v, axis) => v - centers[r - 1][axis])),
          );
        centers.push(center);
      }
      const stroke = {
        vertices,
        rings,
        centers,
        distance,
        positions,
        progress,
      };
      strokes.push(stroke);
      wordStrokes.push(stroke);
    }
  }
  let travelled = 0;
  for (const word of words) {
    const [body, crossbar] = word.strokes;
    body.start = travelled;
    travelled += body.distance.at(-1);
    if (!crossbar) continue;
    // THANK's second tube is t's crossbar, not a stroke after the whole word.
    // Start it when the descending stem meets it in the writing plane; its
    // left-to-right drawing overlaps the rest of t, before h starts.
    let nearest = Infinity;
    let intersection = 0;
    for (let r = 0; r < body.rings; r++) {
      const point = body.centers[r];
      for (const bar of crossbar.centers) {
        const gap = (point[0] - bar[0]) ** 2 + (point[1] - bar[1]) ** 2;
        if (gap < nearest) {
          nearest = gap;
          intersection = r;
        }
      }
    }
    crossbar.start = body.start + body.distance[intersection];
    if (crossbar.start + crossbar.distance.at(-1) > travelled)
      throw new Error("Footer crossbar extends beyond its word");
  }
  const total = travelled;
  for (const {
    vertices,
    rings,
    centers,
    distance,
    positions,
    progress,
    start,
  } of strokes) {
    for (let r = 0; r < rings; r++)
      for (let k = 0; k < 24; k++)
        progress[vertices[r * 24 + k]] = (start + distance[r]) / total;
    // The two pole vertices close each rounded tube end.
    for (const id of vertices.slice(-2)) {
      const gap = (point) =>
        point.reduce(
          (sum, v, axis) => sum + (v - positions[id * 3 + axis]) ** 2,
          0,
        );
      progress[id] =
        (start +
          (gap(centers[0]) < gap(centers.at(-1)) ? 0 : distance.at(-1))) /
        total;
    }
  }
  const buffers = [binary];
  let length = binary.length;
  for (const { primitive, progress } of words) {
    const padding = Buffer.alloc((4 - (length % 4)) % 4);
    buffers.push(padding);
    length += padding.length;
    const bytes = Buffer.from(progress.buffer);
    const bufferView = json.bufferViews.length;
    json.bufferViews.push({
      buffer: 0,
      byteOffset: length,
      byteLength: bytes.length,
      byteStride: 4,
      target: 34962,
    });
    primitive.attributes._STROKE_PROGRESS = json.accessors.length;
    json.accessors.push({
      bufferView,
      componentType: 5126,
      count: progress.length,
      type: "SCALAR",
      min: [Math.min(...progress)],
      max: [Math.max(...progress)],
    });
    buffers.push(bytes);
    length += bytes.length;
  }
  json.buffers[0].byteLength = length;
  const text = Buffer.from(JSON.stringify(json));
  const jsonChunk = Buffer.concat([
    text,
    Buffer.alloc((4 - (text.length % 4)) % 4, 32),
  ]);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + jsonChunk.length + length, 8);
  header.writeUInt32LE(jsonChunk.length, 12);
  header.writeUInt32LE(0x4e4f534a, 16);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(length, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonChunk, binaryHeader, ...buffers]);
}
