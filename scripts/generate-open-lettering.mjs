// Build glass lettering from the bundled OFL-licensed Pacifico outlines.
import fs from "node:fs";
import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buffer => { this.result = buffer; this.onloadend?.(); });
  }
};
const root = new URL("../", import.meta.url);
const font = new FontLoader().parse(JSON.parse(fs.readFileSync(new URL("scripts/open-lettering-font.json", root), "utf8")));
for (const [filename, words] of [["hello-open.glb", ["HELLO"]], ["thank-you-open.glb", ["THANK", "YOU"]]]) {
  const scene = new THREE.Scene();
  scene.userData = { source: "Pacifico", license: "SIL OFL 1.1", notice: "/font/Pacifico-OFL.txt" };
  for (const word of words) {
    const geometry = new TextGeometry(word.toLowerCase(), {
      font, size: 1, depth: .12, curveSegments: 12,
      bevelEnabled: true, bevelThickness: .08, bevelSize: .035, bevelSegments: 8,
    });
    geometry.computeBoundingBox();
    const extent = geometry.boundingBox.getSize(new THREE.Vector3());
    const center = geometry.boundingBox.getCenter(new THREE.Vector3());
    const height = word === "HELLO" ? 3.2 : 1;
    geometry.translate(-center.x, -center.y, -center.z);
    geometry.scale(height / extent.y, height / extent.y, height / extent.y);
    if (word === "HELLO") geometry.translate(0, .5, 0);
    const material = new THREE.MeshBasicMaterial();
    geometry.deleteAttribute("uv");
    const mesh = new THREE.Mesh(mergeVertices(geometry, .00001), material);
    mesh.name = word;
    mesh.userData.baseline = -center.y / extent.y;
    scene.add(mesh);
  }
  const bytes = await new GLTFExporter().parseAsync(scene, { binary: true });
  fs.writeFileSync(new URL(`public/models/${filename}`, root), Buffer.from(bytes));
  console.log(filename, bytes.byteLength);
}
