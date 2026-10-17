"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Portfolio.module.scss";
import { glassVertexShader, glassFragmentShader } from "./glassShaders";
import { pointerRefractionShader } from "./pointerRefractionShader";
import { createStudioEnvironment } from "./studioEnvironment";
import {
  readScroll,
  subscribeScroll,
  getScrollViewport,
} from "./ScrollViewport";

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
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.setClearColor("#beddeb", 1);
        element.appendChild(renderer.domElement);
        let studio = createStudioEnvironment(THREE, renderer);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
        camera.position.set(0, 0, 17);
        const group = new THREE.Group();
        group.scale.setScalar(1.7);
        group.position.set(2, -0.4, 0);
        group.rotation.set(-0.12, -0.14, -0.08);
        scene.add(group);
        const refractionTarget = new THREE.WebGLRenderTarget(1, 1, {
          depthBuffer: false,
          type: THREE.HalfFloatType,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
        });
        const sceneTarget = new THREE.WebGLRenderTarget(1, 1, {
          type: THREE.HalfFloatType,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
        });
        const trail = Array.from({ length: 12 }, () => new THREE.Vector4());
        const strength = Array<number>(12).fill(0);
        const displayMaterial = new THREE.ShaderMaterial({
          toneMapped: false,
          depthTest: false,
          depthWrite: false,
          uniforms: {
            uScene: { value: sceneTarget.texture },
            uResolution: { value: new THREE.Vector2() },
            uTrail: { value: trail },
            uStrength: { value: strength },
          },
          vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
          fragmentShader: pointerRefractionShader,
        });
        const displayScene = new THREE.Scene();
        const displayCamera = new THREE.Camera();
        const displayGeometry = new THREE.PlaneGeometry(2, 2);
        displayScene.add(new THREE.Mesh(displayGeometry, displayMaterial));

        // A real surface behind the glass makes the light bands refract through it.
        const backdropMaterial = new THREE.ShaderMaterial({
          toneMapped: false,
          depthWrite: false,
          uniforms: {
            uTime: { value: 0 },
            uAspect: { value: 1 },
            uSky: { value: new THREE.Color("#beddeb") },
            uWarm: { value: new THREE.Color("#fffaf1") },
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
            uniform vec3 uSky;
            uniform vec3 uWarm;
            uniform vec3 uCool;
            void main() {
              vec2 uv = vUv;
              float drift = sin(uTime * 0.12) * 0.025;
              float lane = uv.x + uv.y * 0.48 + drift
                + sin(uv.y * 8.0 + uv.x * 5.0) * .025;
              float beamA = exp(-pow((lane - 0.48) / 0.09, 2.0));
              float beamB = exp(-pow((lane - 0.98) / 0.12, 2.0));
              float beamC = exp(-pow((lane - 1.42) / 0.08, 2.0));
              float edge = smoothstep(0.0, 0.15, uv.x) * smoothstep(0.0, 0.15, 1.0 - uv.x)
                         * smoothstep(0.0, 0.16, uv.y) * smoothstep(0.0, 0.16, 1.0 - uv.y);
              float glow = exp(-dot((uv - vec2(0.55, 0.42)) * vec2(uAspect, 1.0),
                                   (uv - vec2(0.55, 0.42)) * vec2(uAspect, 1.0)) * 6.0);
              vec3 color = mix(uSky, uCool, 0.12 * edge);
              color = mix(color, uWarm, clamp((beamA * 0.88 + beamB * 0.95 + beamC * 0.65 + glow * 0.08) * edge, 0.0, 0.95));
              // The reference uses a separate fixed SVG grid above the scene.
              gl_FragColor = vec4(color, 1.0);
              #include <colorspace_fragment>
            }
          `,
        });
        const backdropGeometry = new THREE.PlaneGeometry(1, 1);
        const backdrop = new THREE.Mesh(backdropGeometry, backdropMaterial);
        backdrop.position.z = -5;
        scene.add(backdrop);

        const material = new THREE.ShaderMaterial({
          // The sampled backdrop is already scene-linear. Match its output curve
          // instead of applying ACES only to the glass and lifting it to milky gray.
          toneMapped: false,
          vertexShader: glassVertexShader,
          fragmentShader: glassFragmentShader,
          uniforms: {
            uScene: { value: refractionTarget.texture },
            uStudio: { value: studio.texture },
            uResolution: { value: new THREE.Vector2() },
            uLight: { value: new THREE.Vector3(4, 9, 5) },
            uTintTop: { value: new THREE.Color("#247fe8") },
            uTintBottom: { value: new THREE.Color("#f5f9ff") },
          },
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
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const pointer = { x: 0, y: 0 };
        const lightTarget = new THREE.Vector3();
        let previousPointer: { x: number; y: number } | null = null;
        let previousTime = 0;
        let frame = 0;
        let visible = true;
        let exposed = true;
        let contextLost = false;
        let scrollTop = readScroll().top;
        let viewportHeight = readScroll().height;
        let contactVisible = false;
        let worldHeight = 1;
        const bounds = new THREE.Box3().setFromObject(group);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const resize = () => {
          const { width, height } = element.getBoundingClientRect();
          renderer.setSize(width, height);
          renderer.getDrawingBufferSize(material.uniforms.uResolution.value);
          refractionTarget.setSize(
            Math.max(1, Math.round(material.uniforms.uResolution.value.x)),
            Math.max(1, Math.round(material.uniforms.uResolution.value.y)),
          );
          sceneTarget.setSize(refractionTarget.width, refractionTarget.height);
          displayMaterial.uniforms.uResolution.value.copy(
            material.uniforms.uResolution.value,
          );
          camera.aspect = width / Math.max(height, 1);
          const halfFov = (camera.fov * Math.PI) / 360;
          const distance =
            (Math.max(size.y, size.x / camera.aspect) /
              (2 * Math.tan(halfFov))) *
              1.5 +
            size.z / 2;
          camera.position.set(center.x, center.y, distance);
          camera.updateProjectionMatrix();
          worldHeight = 2 * Math.tan(halfFov) * distance;
          backdrop.position.x = center.x;
          backdrop.position.y = center.y;
          const viewHeight =
            2 * Math.tan(halfFov) * (distance - backdrop.position.z);
          backdrop.scale.set(viewHeight * camera.aspect, viewHeight, 1);
          backdropMaterial.uniforms.uAspect.value = camera.aspect;
        };
        const move = (event: PointerEvent) => {
          if (event.pointerType === "touch" || motion.matches || !exposed)
            return;
          const rect = element.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = 1 - (event.clientY - rect.top) / rect.height;
          pointer.x = x - 0.5;
          pointer.y = 0.5 - y;
          if (previousPointer) {
            const dx = Math.max(-0.18, Math.min(0.18, x - previousPointer.x));
            const dy = Math.max(-0.18, Math.min(0.18, y - previousPointer.y));
            if (Math.hypot(dx, dy) > 0.0005) {
              for (let i = trail.length - 1; i > 0; i--) {
                trail[i].copy(trail[i - 1]);
                strength[i] = strength[i - 1];
              }
              trail[0].set(x, y, dx, dy);
              strength[0] = 1;
            }
          }
          previousPointer = { x, y };
        };
        const leave = () => {
          pointer.x = 0;
          pointer.y = 0;
          previousPointer = null;
        };
        const render = (time: number) => {
          frame = 0;
          if (
            disposed ||
            !visible ||
            !exposed ||
            document.hidden ||
            contextLost
          )
            return;
          const dt = Math.min(0.1, Math.max(0, (time - previousTime) / 1000));
          previousTime = time;
          for (let i = 0; i < strength.length; i++)
            strength[i] = motion.matches
              ? 0
              : strength[i] * Math.exp(-dt * 3.5);
          element.dataset.pointerEnergy = Math.max(...strength).toFixed(3);
          if (!motion.matches) {
            material.uniforms.uLight.value.lerp(
              lightTarget.set(4 + pointer.x * 14, 9 - pointer.y * 14, 5),
              1 - Math.exp(-8 * dt),
            );
            backdropMaterial.uniforms.uTime.value = time * 0.001;
            group.rotation.y +=
              (-0.14 +
                Math.min(1, scrollTop / viewportHeight) * 1.64 +
                pointer.x * 0.16 -
                group.rotation.y) *
              0.08;
            group.rotation.x +=
              (-0.12 + pointer.y * 0.18 - group.rotation.x) * 0.035;
            group.position.y =
              -0.4 +
              (scrollTop / viewportHeight) * worldHeight * 0.72 +
              Math.sin(time * 0.00065) * 0.07;
          } else {
            leave();
            material.uniforms.uLight.value.set(4, 9, 5);
            group.position.y =
              -0.4 + (scrollTop / viewportHeight) * worldHeight * 0.72;
          }
          // Render the backdrop first, excluding the glass from its own texture.
          group.visible = false;
          renderer.setRenderTarget(refractionTarget);
          renderer.render(scene, camera);
          group.visible = !contactVisible;
          element.dataset.scene = contactVisible
            ? "footer-background"
            : "hello";
          renderer.setRenderTarget(sceneTarget);
          renderer.render(scene, camera);
          renderer.setRenderTarget(null);
          renderer.render(displayScene, displayCamera);
          if (!motion.matches) frame = requestAnimationFrame(render);
        };
        const resume = () => {
          if (!frame && visible && exposed && !document.hidden && !contextLost)
            frame = requestAnimationFrame(render);
        };
        const scroll = () => {
          const state = readScroll();
          scrollTop = state.top;
          viewportHeight = state.height;
          const heroBottom =
            document.querySelector("[data-hero]")?.getBoundingClientRect()
              .bottom ?? viewportHeight;
          const footerTop =
            document.getElementById("contact")?.getBoundingClientRect().top ??
            viewportHeight;
          contactVisible = footerTop < viewportHeight;
          exposed = heroBottom > 0 || contactVisible;
          if (!exposed) {
            cancelAnimationFrame(frame);
            frame = 0;
          }
          resume();
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
        const pointerSurface = getScrollViewport();
        pointerSurface?.addEventListener("pointermove", move);
        pointerSurface?.addEventListener("pointerleave", leave);
        document.addEventListener("visibilitychange", resume);
        const unsubscribe = subscribeScroll(scroll);
        motion.addEventListener("change", resume);
        const lost = (event: Event) => {
          event.preventDefault();
          contextLost = true;
          setReady(false);
          cancelAnimationFrame(frame);
          frame = 0;
        };
        const restored = () => {
          contextLost = false;
          // Render-target contents do not survive WebGL context loss.
          studio.dispose();
          studio = createStudioEnvironment(THREE, renderer);
          material.uniforms.uStudio.value = studio.texture;
          resize();
          resume();
          setReady(true);
        };
        renderer.domElement.addEventListener("webglcontextlost", lost);
        renderer.domElement.addEventListener("webglcontextrestored", restored);
        resize();
        render(0);
        setReady(true);
        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          resizer.disconnect();
          pointerSurface?.removeEventListener("pointermove", move);
          pointerSurface?.removeEventListener("pointerleave", leave);
          document.removeEventListener("visibilitychange", resume);
          unsubscribe();
          motion.removeEventListener("change", resume);
          renderer.domElement.removeEventListener("webglcontextlost", lost);
          renderer.domElement.removeEventListener(
            "webglcontextrestored",
            restored,
          );
          const usedGeometry = new Set<
            InstanceType<typeof THREE.BufferGeometry>
          >();
          group.traverse((object) => {
            if (object instanceof THREE.Mesh) usedGeometry.add(object.geometry);
          });
          usedGeometry.forEach((geometry) => geometry.dispose());
          material.dispose();
          studio.dispose();
          backdropGeometry.dispose();
          backdropMaterial.dispose();
          refractionTarget.dispose();
          sceneTarget.dispose();
          displayMaterial.dispose();
          displayGeometry.dispose();
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
    <div
      className={styles.glassScene}
      ref={host}
      data-glass-scene
      data-ready={ready}
      data-lighting="studio-environment"
      aria-hidden="true"
    >
      <span
        className={`${styles.glassFallback} ${ready ? styles.glassReady : ""}`}
      >
        hello
      </span>
    </div>
  );
}
