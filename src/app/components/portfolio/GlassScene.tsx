"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Portfolio.module.scss";

// Continuous hand-drawn curves form original inflated glass lettering.
const strokes: number[][][] = [
  [
    [-5, -0.75],
    [-4.65, -0.15],
    [-4.3, 1.25],
    [-4.1, 2.05],
    [-4.4, 2.2],
    [-4.7, 1.65],
    [-4.85, 0.55],
    [-4.8, -0.75],
    [-4.48, 0.05],
    [-4.06, 0.55],
    [-3.65, 0.4],
    [-3.8, -0.48],
    [-3.6, -0.78],
    [-3.1, -0.45],
  ],
  [
    [-3.25, -0.35],
    [-2.78, -0.12],
    [-2.45, 0.45],
    [-2.75, 0.73],
    [-3.2, 0.42],
    [-3.4, -0.22],
    [-3.13, -0.73],
    [-2.52, -0.81],
    [-1.88, -0.24],
  ],
  [
    [-1.95, -0.35],
    [-1.52, 0.7],
    [-1.02, 1.9],
    [-1.12, 2.24],
    [-1.5, 1.98],
    [-1.9, 0.95],
    [-2.1, -0.12],
    [-1.97, -0.7],
    [-1.55, -0.8],
    [-0.9, -0.2],
  ],
  [
    [-0.98, -0.35],
    [-0.5, 0.7],
    [0, 1.9],
    [-0.1, 2.24],
    [-0.48, 1.98],
    [-0.88, 0.95],
    [-1.08, -0.12],
    [-0.95, -0.7],
    [-0.53, -0.8],
    [0.2, -0.23],
  ],
  [
    [1.52, 0.48],
    [0.91, 0.65],
    [0.36, 0.2],
    [0.1, -0.42],
    [0.43, -0.85],
    [1.07, -0.76],
    [1.52, -0.1],
    [1.45, 0.51],
    [1.05, 0.67],
    [1.55, 0.48],
    [2.18, 0.56],
    [2.65, 0.88],
  ],
];

export default function GlassScene() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    let cleanup = () => {};
    import("three")
      .then((THREE) => {
        if (disposed) return;
        let renderer: InstanceType<typeof THREE.WebGLRenderer>;
        try {
          renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "low-power",
          });
        } catch {
          return;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.35;
        element.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
        camera.position.set(0, 0, 17);
        const group = new THREE.Group();
        group.scale.setScalar(1.7);
        group.position.set(2, -0.4, 0);
        group.rotation.set(-0.12, -0.14, -0.08);
        scene.add(group);
        const environmentCanvas = document.createElement("canvas");
        environmentCanvas.width = 1024;
        environmentCanvas.height = 512;
        const context = environmentCanvas.getContext("2d")!;
        const sky = context.createLinearGradient(0, 0, 0, 512);
        sky.addColorStop(0, "#729fdc");
        sky.addColorStop(0.45, "#d9edfb");
        sky.addColorStop(0.65, "#fdf8e7");
        sky.addColorStop(1, "#4c78bd");
        context.fillStyle = sky;
        context.fillRect(0, 0, 1024, 512);
        context.filter = "blur(10px)";
        context.fillStyle = "#ffffff";
        context.fillRect(180, 60, 85, 330);
        context.fillRect(580, 40, 210, 85);
        context.fillRect(850, 220, 90, 200);
        context.fillStyle = "#c4b9f9";
        context.fillRect(30, 280, 100, 100);
        const texture = new THREE.CanvasTexture(environmentCanvas);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        const pmrem = new THREE.PMREMGenerator(renderer);
        const environment = pmrem.fromEquirectangular(texture);
        scene.environment = environment.texture;
        const material = new THREE.MeshPhysicalMaterial({
          color: "#508edf",
          metalness: 0.18,
          roughness: 0.085,
          transmission: 0.42,
          thickness: 1.6,
          ior: 1.46,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          envMapIntensity: 2.1,
          iridescence: 0.24,
          attenuationColor: new THREE.Color("#78a9ef"),
          attenuationDistance: 2,
        });
        strokes.forEach((stroke, index) => {
          const curve = new THREE.CatmullRomCurve3(
            stroke.map(
              ([x, y], i) =>
                new THREE.Vector3(x, y, Math.sin(i * 0.75 + index) * 0.075),
            ),
            false,
            "centripetal",
          );
          group.add(
            new THREE.Mesh(
              new THREE.TubeGeometry(curve, 150, 0.215, 16, false),
              material,
            ),
          );
          const capGeometry = new THREE.SphereGeometry(0.215, 16, 12);
          for (const end of [curve.getPoint(0), curve.getPoint(1)]) {
            const cap = new THREE.Mesh(capGeometry, material);
            cap.position.copy(end);
            group.add(cap);
          }
        });
        scene.add(new THREE.HemisphereLight("#e9f5ff", "#487cce", 3));
        const key = new THREE.DirectionalLight("#ffffff", 4);
        key.position.set(-3, 5, 5);
        scene.add(key);
        const rim = new THREE.PointLight("#d7c9ff", 30, 15);
        rim.position.set(4, 1, 3);
        scene.add(rim);
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const pointer = { x: 0, y: 0 };
        let frame = 0;
        let visible = true;
        const resize = () => {
          const { width, height } = element.getBoundingClientRect();
          renderer.setSize(width, height);
          camera.aspect = width / Math.max(height, 1);
          camera.position.z = camera.aspect < 1.6 ? 23 : 17;
          camera.updateProjectionMatrix();
        };
        const move = (event: PointerEvent) => {
          const rect = element.getBoundingClientRect();
          pointer.x = (event.clientX - rect.left) / rect.width - 0.5;
          pointer.y = (event.clientY - rect.top) / rect.height - 0.5;
        };
        const leave = () => {
          pointer.x = 0;
          pointer.y = 0;
        };
        const render = (time: number) => {
          frame = 0;
          if (disposed || !visible || document.hidden) return;
          if (!motion.matches) {
            group.rotation.y +=
              (-0.14 + pointer.x * 0.32 - group.rotation.y) * 0.035;
            group.rotation.x +=
              (-0.12 + pointer.y * 0.18 - group.rotation.x) * 0.035;
            group.position.y = -0.4 + Math.sin(time * 0.00065) * 0.07;
          }
          renderer.render(scene, camera);
          if (!motion.matches) frame = requestAnimationFrame(render);
        };
        const resume = () => {
          if (!frame && visible && !document.hidden)
            frame = requestAnimationFrame(render);
        };
        const observer = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible) resume();
          else {
            cancelAnimationFrame(frame);
            frame = 0;
          }
        });
        observer.observe(element);
        const resizer = new ResizeObserver(() => {
          resize();
          resume();
        });
        resizer.observe(element);
        element.addEventListener("pointermove", move);
        element.addEventListener("pointerleave", leave);
        document.addEventListener("visibilitychange", resume);
        motion.addEventListener("change", resume);
        const lost = (event: Event) => {
          event.preventDefault();
          setReady(false);
          cancelAnimationFrame(frame);
        };
        renderer.domElement.addEventListener("webglcontextlost", lost);
        resize();
        render(0);
        setReady(true);
        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          resizer.disconnect();
          element.removeEventListener("pointermove", move);
          element.removeEventListener("pointerleave", leave);
          document.removeEventListener("visibilitychange", resume);
          motion.removeEventListener("change", resume);
          renderer.domElement.removeEventListener("webglcontextlost", lost);
          const usedGeometry = new Set<
            InstanceType<typeof THREE.BufferGeometry>
          >();
          group.traverse((object) => {
            if (object instanceof THREE.Mesh) usedGeometry.add(object.geometry);
          });
          usedGeometry.forEach((geometry) => geometry.dispose());
          material.dispose();
          environment.dispose();
          texture.dispose();
          pmrem.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      })
      .catch(() => {
        /* Typography remains visible when WebGL is unavailable. */
      });
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);
  return (
    <div className={styles.glassScene} ref={host} aria-hidden="true">
      <span
        className={`${styles.glassFallback} ${ready ? styles.glassReady : ""}`}
      >
        hello
      </span>
    </div>
  );
}
