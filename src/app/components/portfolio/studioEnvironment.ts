import type { WebGLRenderer } from "three";

/** Capture actual emissive studio panels once; the glass samples their reflected
 * radiance rather than treating the background image as its only illumination. */
export function createStudioEnvironment(
  THREE: typeof import("three"),
  renderer: WebGLRenderer,
) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#244065");
  const resources: { dispose(): void }[] = [];
  const panel = (
    width: number,
    height: number,
    position: number[],
    color: string,
    intensity: number,
  ) => {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    resources.push(geometry, material);
  };
  panel(7, 1.25, [-3, 5, 5], "#ffffff", 5);
  panel(0.65, 7, [5, 1, 4], "#b8e7ff", 4);
  panel(5, 0.35, [-1, -4, 5], "#fff9e9", 3.5);
  panel(3, 4, [-6, 0, -2], "#438df5", 0.9);
  for (let i = 0; i < 3; i++) {
    panel(0.3, 1.5, [-2.4 + i * 1.1, 2.5, 7], "#ffffff", 6);
  }
  const target = new THREE.WebGLCubeRenderTarget(
    (renderer.domElement.parentElement?.clientWidth ??
      renderer.domElement.clientWidth) > 760
      ? 512
      : 256,
    {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
      depthBuffer: true,
    },
  );
  const camera = new THREE.CubeCamera(0.1, 30, target);
  const previousTarget = renderer.getRenderTarget();
  camera.update(renderer, scene);
  renderer.setRenderTarget(previousTarget);
  resources.forEach((resource) => resource.dispose());
  return target;
}
