"use client";

import { useEffect, useRef } from "react";
import { getScrollViewport, subscribeScroll } from "./ScrollViewport";
import { storyTransition, STORY_SCREENS } from "./storyMotion";
import { storyVertexShader, storyFragmentShader } from "./storyShaders";
import styles from "./Portfolio.module.scss";

export default function StoryBackdrop() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let disposed = false;
    let cleanup = () => {};
    import("three")
      .then((THREE) => {
        if (disposed) return;
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        const surface = getScrollViewport();
        let renderer: InstanceType<typeof THREE.WebGLRenderer>;
        try {
          renderer = new THREE.WebGLRenderer({
            canvas: element,
            alpha: true,
            antialias: true,
            powerPreference: "low-power",
          });
        } catch {
          surface?.setAttribute("data-story-fallback", "true");
          cleanup = () => surface?.removeAttribute("data-story-fallback");
          return;
        }
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.setClearColor(0, 0);
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20000);
        camera.position.z = 10000;
        // Rounded, extruded pointer.
        const shape = new THREE.Shape();
        shape.moveTo(-0.44, 0.48);
        shape.quadraticCurveTo(-0.53, 0.53, -0.48, 0.39);
        shape.lineTo(-0.075, -0.43);
        shape.quadraticCurveTo(0.005, -0.57, 0.065, -0.42);
        shape.lineTo(0.165, -0.165);
        shape.lineTo(0.43, -0.065);
        shape.quadraticCurveTo(0.57, -0.005, 0.43, 0.075);
        shape.closePath();
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 0.085,
          bevelEnabled: true,
          bevelSize: 0.035,
          bevelThickness: 0.045,
          bevelSegments: 3,
          curveSegments: 20,
          steps: 1,
        });
        geometry.translate(0, 0, -0.0425);
        geometry.scale(0.68, 0.68, 0.68);
        geometry.computeVertexNormals();
        const material = new THREE.ShaderMaterial({
          vertexShader: storyVertexShader,
          fragmentShader: storyFragmentShader,
          side: THREE.DoubleSide,
          toneMapped: false,
          uniforms: {
            uResolution: { value: new THREE.Vector2() },
            uAccent: { value: new THREE.Color("#009dff") },
            uReveal: { value: 0 },
            uTravel: { value: 0 },
            uLight: { value: new THREE.Vector2(-1, 2) },
          },
        });
        const anchor = new THREE.Group();
        const axis = new THREE.Group();
        const spin = new THREE.Group();
        const mesh = new THREE.Mesh(geometry, material);
        axis.rotation.z = Math.PI / 4;
        mesh.rotation.z = -Math.PI / 4;
        spin.add(mesh);
        axis.add(spin);
        anchor.add(axis);
        scene.add(anchor);
        let top = innerHeight * 10,
          height = innerHeight,
          progress = 0,
          frame = 0,
          lastTime = 0;
        let width = 0,
          oldHeight = 0,
          contextLost = false;
        const pointer = new THREE.Vector2(-1, 2);
        const fallback = () => {
          surface?.setAttribute("data-story-fallback", "true");
          surface?.setAttribute(
            "data-story-dark",
            String(top <= 80 && top + height * STORY_SCREENS > 80),
          );
        };
        const draw = (time: number) => {
          frame = 0;
          if (disposed || document.hidden || contextLost) return;
          const dt = Math.min(0.1, Math.max(1 / 240, (time - lastTime) / 1000));
          lastTime = time;
          if (width !== innerWidth || oldHeight !== height) {
            width = innerWidth;
            oldHeight = height;
            renderer.setSize(width, height, false);
            renderer.getDrawingBufferSize(material.uniforms.uResolution.value);
            camera.left = -width / 2;
            camera.right = width / 2;
            camera.top = height / 2;
            camera.bottom = -height / 2;
            camera.updateProjectionMatrix();
          }
          const state = storyTransition(top, height);
          progress += (state.progress - progress) * (1 - Math.exp(-32 * dt));
          if (!motion.matches)
            surface?.setAttribute(
              "data-story-dark",
              String(state.visible && progress >= 0.5),
            );
          anchor.visible = state.visible && !motion.matches;
          material.uniforms.uLight.value.lerp(pointer, 1 - Math.exp(-8 * dt));
          if (anchor.visible) {
            const size = 100 + Math.hypot(width, height) * 3.28 * progress;
            anchor.position.y = height / 2 - state.centerY;
            mesh.scale.setScalar(size);
            spin.rotation.y =
              state.shrink > 0
                ? Math.PI * (1 + Math.max(0, (state.shrink - 0.6) / 0.4))
                : Math.PI * Math.min(1, progress / 0.4);
            material.uniforms.uReveal.value = progress;
            material.uniforms.uTravel.value = Math.min(
              1,
              Math.max(0, (height - top) / (height * (STORY_SCREENS + 1))),
            );
          }
          renderer.render(scene, camera);
          element.dataset.ready = "true";
          if (
            Math.abs(state.progress - progress) > 0.0001 ||
            material.uniforms.uLight.value.distanceTo(pointer) > 0.001
          )
            frame = requestAnimationFrame(draw);
        };
        const request = () => {
          if (!frame && !document.hidden && !contextLost) {
            lastTime = performance.now();
            frame = requestAnimationFrame(draw);
          }
        };
        const move = (event: PointerEvent) => {
          if (event.pointerType === "touch" || motion.matches) return;
          pointer.set(
            (event.clientX / innerWidth - 0.5) * 6,
            (0.5 - event.clientY / innerHeight) * 6,
          );
          request();
        };
        const unsubscribe = subscribeScroll((state) => {
          top =
            document
              .querySelector("[data-scroll-story]")
              ?.getBoundingClientRect().top ?? state.height * 10;
          height = state.height;
          if (contextLost) fallback();
          request();
        });
        const lost = (event: Event) => {
          event.preventDefault();
          contextLost = true;
          cancelAnimationFrame(frame);
          frame = 0;
          fallback();
        };
        const restored = () => {
          contextLost = false;
          surface?.removeAttribute("data-story-fallback");
          request();
        };
        surface?.addEventListener("pointermove", move);
        motion.addEventListener("change", request);
        document.addEventListener("visibilitychange", request);
        element.addEventListener("webglcontextlost", lost);
        element.addEventListener("webglcontextrestored", restored);
        cleanup = () => {
          cancelAnimationFrame(frame);
          unsubscribe();
          surface?.removeEventListener("pointermove", move);
          surface?.removeAttribute("data-story-fallback");
          motion.removeEventListener("change", request);
          document.removeEventListener("visibilitychange", request);
          element.removeEventListener("webglcontextlost", lost);
          element.removeEventListener("webglcontextrestored", restored);
          geometry.dispose();
          material.dispose();
          renderer.dispose();
        };
      })
      .catch(() => {
        if (!disposed)
          getScrollViewport()?.setAttribute("data-story-fallback", "true");
      });
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);
  return (
    <canvas
      ref={canvas}
      className={styles.storyBackdrop}
      data-story-backdrop
      aria-hidden="true"
    />
  );
}
