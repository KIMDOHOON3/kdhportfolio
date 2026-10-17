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
    Promise.all([
      import("three"),
      import("three/addons/environments/RoomEnvironment.js"),
    ])
      .then(([THREE, { RoomEnvironment }]) => {
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
        renderer.toneMappingExposure = 1.1;
        renderer.setClearColor("#beddeb", 1);
        element.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
        camera.position.set(0, 0, 17);
        const group = new THREE.Group();
        group.scale.setScalar(1.7);
        group.position.set(2, -0.4, 0);
        group.rotation.set(-0.12, -0.14, -0.08);
        scene.add(group);
        const pmrem = new THREE.PMREMGenerator(renderer);
        const studio = new RoomEnvironment();
        const panels = [
          { size: [14, 0.8], position: [0, 7, 7], color: "#fff8e7" },
          { size: [0.7, 12], position: [-7, 2, 5], color: "#e0edff" },
          { size: [10, 0.5], position: [2, -4, 5], color: "#ffffff" },
        ];
        panels.forEach(({ size, position, color }) => {
          const panel = new THREE.Mesh(
            new THREE.PlaneGeometry(size[0], size[1]),
            new THREE.MeshBasicMaterial({
              color: new THREE.Color(color).multiplyScalar(5),
              side: THREE.DoubleSide,
            }),
          );
          panel.position.set(position[0], position[1], position[2]);
          panel.lookAt(0, 0, 0);
          studio.add(panel);
        });
        const environment = pmrem.fromScene(studio, 0.025);
        studio.dispose();
        scene.environment = environment.texture;
        scene.environmentRotation.set(0.12, 0.45, -0.2);

        // A real surface behind the glass makes the light bands refract through it.
        const backdropMaterial = new THREE.ShaderMaterial({
          toneMapped: false,
          depthWrite: false,
          uniforms: {
            uTime: { value: 0 },
            uAspect: { value: 1 },
            uWidth: { value: 1 },
            uGridGap: { value: 0 },
            uGridColumns: { value: 4 },
            uGridColor: { value: new THREE.Color("#233845") },
            uSky: { value: new THREE.Color("#beddeb") },
            uWarm: { value: new THREE.Color("#fff9df") },
            uCool: { value: new THREE.Color("#8fbde9") },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec2 vUv;
            uniform float uTime;
            uniform float uAspect;
            uniform float uWidth;
            uniform float uGridGap;
            uniform float uGridColumns;
            uniform vec3 uGridColor;
            uniform vec3 uSky;
            uniform vec3 uWarm;
            uniform vec3 uCool;
            void main() {
              vec2 uv = vUv;
              float drift = sin(uTime * 0.12) * 0.025;
              float lane = uv.x + uv.y * 0.48 + drift;
              float beamA = exp(-pow((lane - 0.48) / 0.095, 2.0));
              float beamB = exp(-pow((lane - 0.98) / 0.14, 2.0));
              float beamC = exp(-pow((lane - 1.42) / 0.065, 2.0));
              float edge = smoothstep(0.0, 0.15, uv.x) * smoothstep(0.0, 0.15, 1.0 - uv.x)
                         * smoothstep(0.0, 0.16, uv.y) * smoothstep(0.0, 0.16, 1.0 - uv.y);
              float glow = exp(-dot((uv - vec2(0.55, 0.42)) * vec2(uAspect, 1.0),
                                   (uv - vec2(0.55, 0.42)) * vec2(uAspect, 1.0)) * 6.0);
              vec3 color = mix(uSky, uCool, 0.12 * edge);
              color = mix(color, uWarm, clamp((beamA * 0.88 + beamB * 0.95 + beamC * 0.65 + glow * 0.24) * edge, 0.0, 0.95));
              float track = (1.0 - (uGridColumns - 1.0) * uGridGap) / uGridColumns;
              float lineDistance = 1.0;
              for (int i = 0; i < 4; i++) {
                if (float(i) < uGridColumns) {
                  float left = float(i) * (track + uGridGap);
                  lineDistance = min(lineDistance, min(abs(uv.x - left), abs(uv.x - left - track)));
                }
              }
              float line = 1.0 - smoothstep(0.25 / uWidth, 1.25 / uWidth, lineDistance);
              color = mix(color, uGridColor, line * 0.075);
              gl_FragColor = vec4(color, 1.0);
              #include <colorspace_fragment>
            }
          `,
        });
        const backdropGeometry = new THREE.PlaneGeometry(1, 1);
        const backdrop = new THREE.Mesh(backdropGeometry, backdropMaterial);
        backdrop.position.z = -5;
        scene.add(backdrop);

        const material = new THREE.MeshPhysicalMaterial({
          color: "#c7e1ff",
          metalness: 0,
          roughness: 0.018,
          transmission: 1,
          thickness: 1.3,
          ior: 1.5,
          dispersion: 0.06,
          clearcoat: 0.15,
          clearcoatRoughness: 0.025,
          envMapIntensity: 1.1,
          iridescence: 0.08,
          attenuationColor: new THREE.Color("#8ab5ef"),
          attenuationDistance: 5,
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
              new THREE.TubeGeometry(curve, 150, 0.215, 24, false),
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
        scene.add(new THREE.HemisphereLight("#e9f5ff", "#487cce", 0.7));
        const key = new THREE.DirectionalLight("#fff9ec", 3);
        key.position.set(-3, 5, 5);
        scene.add(key);
        const rim = new THREE.PointLight("#c9e6ff", 55, 30);
        rim.position.set(5, 4, -2);
        scene.add(rim);
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const pointer = { x: 0, y: 0 };
        let frame = 0;
        let visible = true;
        const bounds = new THREE.Box3().setFromObject(group);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const resize = () => {
          const { width, height } = element.getBoundingClientRect();
          renderer.setSize(width, height);
          camera.aspect = width / Math.max(height, 1);
          const halfFov = (camera.fov * Math.PI) / 360;
          const distance =
            (Math.max(size.y, size.x / camera.aspect) /
              (2 * Math.tan(halfFov))) *
              1.1 +
            size.z / 2;
          camera.position.set(center.x, center.y, distance);
          camera.updateProjectionMatrix();
          backdrop.position.x = center.x;
          backdrop.position.y = center.y;
          const viewHeight =
            2 * Math.tan(halfFov) * (distance - backdrop.position.z);
          backdrop.scale.set(viewHeight * camera.aspect, viewHeight, 1);
          backdropMaterial.uniforms.uAspect.value = camera.aspect;
          const layout = getComputedStyle(element);
          backdropMaterial.uniforms.uWidth.value = width;
          backdropMaterial.uniforms.uGridGap.value =
            parseFloat(layout.getPropertyValue("--grid-gap")) / width;
          backdropMaterial.uniforms.uGridColumns.value = parseFloat(
            layout.getPropertyValue("--grid-count"),
          );
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
            backdropMaterial.uniforms.uTime.value = time * 0.001;
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
          backdropGeometry.dispose();
          backdropMaterial.dispose();
          environment.dispose();
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
