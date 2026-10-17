"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Portfolio.module.scss";
import {
  glassVertexShader,
  glassFragmentShader,
  glassBackVertexShader,
  glassBackFragmentShader,
} from "./glassShaders";
import {
  pointerRefractionShader,
  backdropRefractionShader,
} from "./pointerRefractionShader";
import { flowFragmentShader } from "./flowShader";
import { createStudioEnvironment } from "./studioEnvironment";
import { createFluidProjection } from "./FluidProjection";
import { glassFlareShader } from "./glassFlareShader";
import {
  readScroll,
  subscribeScroll,
  getScrollViewport,
} from "./ScrollViewport";

export default function GlassScene() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
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
          setFailed(true);
          return;
        }
        const nativePixelRatio = Math.min(window.devicePixelRatio, 2);
        renderer.setPixelRatio(nativePixelRatio);
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
        group.rotation.set(0, 0.07, 0);
        scene.add(group);
        const refractionTarget = new THREE.WebGLRenderTarget(1, 1, {
          depthBuffer: false,
          type: THREE.HalfFloatType,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
        });
        const backSurfaceTarget = new THREE.WebGLRenderTarget(1, 1, {
          type: THREE.HalfFloatType,
          minFilter: THREE.NearestFilter,
          magFilter: THREE.NearestFilter,
          depthBuffer: true,
        });
        const backSurfaceMaterial = new THREE.ShaderMaterial({
          toneMapped: false,
          side: THREE.BackSide,
          uniforms: { uDepthOrigin: { value: camera.position.z } },
          vertexShader: glassBackVertexShader,
          fragmentShader: glassBackFragmentShader,
        });
        const sceneTarget = new THREE.WebGLRenderTarget(1, 1, {
          type: THREE.HalfFloatType,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          samples: Math.min(4, renderer.capabilities.maxSamples),
        });
        let flowRead = new THREE.WebGLRenderTarget(256, 256, {
          depthBuffer: false,
          type: THREE.HalfFloatType,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
        });
        let flowWrite = flowRead.clone();
        const flowProjection = createFluidProjection(THREE, renderer);
        const flareTarget = new THREE.WebGLRenderTarget(1, 1, {
          type: THREE.HalfFloatType,
          depthBuffer: false,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
        });
        const flareMaterial = new THREE.ShaderMaterial({
          toneMapped: false,
          depthTest: false,
          depthWrite: false,
          uniforms: {
            uScene: { value: sceneTarget.texture },
            uResolution: { value: new THREE.Vector2() },
          },
          vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,
          fragmentShader: glassFlareShader,
        });
        const flowMaterial = new THREE.ShaderMaterial({
          toneMapped: false,
          depthTest: false,
          depthWrite: false,
          uniforms: {
            uPrevious: { value: flowRead.texture },
            uTexel: { value: new THREE.Vector2(1 / 256, 1 / 256) },
            uPointer: { value: new THREE.Vector2(-10, -10) },
            uVelocity: { value: new THREE.Vector2() },
            uAspect: { value: 1 },
            uImpulse: { value: 0 },
            uDt: { value: 1 / 60 },
          },
          vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
          fragmentShader: flowFragmentShader,
        });
        const displayMaterial = new THREE.ShaderMaterial({
          toneMapped: false,
          depthTest: false,
          depthWrite: false,
          uniforms: {
            uScene: { value: sceneTarget.texture },
            uFlare: { value: flareTarget.texture },
          },
          vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
          fragmentShader: pointerRefractionShader,
        });
        const displayScene = new THREE.Scene();
        const displayCamera = new THREE.Camera();
        const displayGeometry = new THREE.PlaneGeometry(2, 2);
        displayScene.add(new THREE.Mesh(displayGeometry, displayMaterial));
        const flareScene = new THREE.Scene();
        flareScene.add(new THREE.Mesh(displayGeometry, flareMaterial));
        const flowScene = new THREE.Scene();
        flowScene.add(new THREE.Mesh(displayGeometry, flowMaterial));

        // A real surface behind the glass makes the light bands refract through it.
        const backdropMaterial = new THREE.ShaderMaterial({
          toneMapped: false,
          depthWrite: false,
          uniforms: {
            uAspect: { value: 1 },
            uSky: { value: new THREE.Color("#beddeb") },
            uWarm: { value: new THREE.Color("#fffaf1") },
            uCool: { value: new THREE.Color("#8fbde9") },
            uResolution: { value: new THREE.Vector2() },
            uFlow: { value: flowRead.texture },
            uFlowTexel: { value: flowMaterial.uniforms.uTexel.value },
            uMotion: { value: 1 },
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
            uniform float uAspect;
            uniform vec3 uSky;
            uniform vec3 uWarm;
            uniform vec3 uCool;
            uniform vec2 uResolution;
            ${backdropRefractionShader}
            void main() {
              vec2 uv = refractedBackdropUv(vUv, gl_FragCoord.xy / uResolution);
              float lane = uv.x + uv.y * 0.42
                + sin(uv.y * 5.0 + uv.x * 3.0) * .012;
              float beams = exp(-pow((lane - 0.35) / 0.13, 2.0))
                + 0.8 * exp(-pow((lane - 1.02) / 0.17, 2.0));
              float edge = smoothstep(0.0, 0.15, uv.x) * smoothstep(0.0, 0.15, 1.0 - uv.x)
                         * smoothstep(0.0, 0.16, uv.y) * smoothstep(0.0, 0.16, 1.0 - uv.y);
              float glow = exp(-dot((uv - vec2(0.55, 0.42)) * vec2(uAspect, 1.0),
                                   (uv - vec2(0.55, 0.42)) * vec2(uAspect, 1.0)) * 6.0);
              float warmBase = smoothstep(0.38, 0.98, 1.0 - uv.y);
              vec3 color = mix(uSky, uWarm, warmBase * 0.92);
              color = mix(color, uCool, 0.05 * edge * (1.0 - warmBase));
              color = mix(color, uWarm, clamp((beams*0.48 + glow*0.04)*edge,0.0,0.52));
              // The backdrop contains only procedural color and light bands.
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
            uBackSurface: { value: backSurfaceTarget.texture },
            uProjection: { value: camera.projectionMatrix },
            uDepthOrigin: backSurfaceMaterial.uniforms.uDepthOrigin,
            uStudio: { value: studio.texture },
            uResolution: { value: new THREE.Vector2() },
            uLight: { value: new THREE.Vector3(4, 9, 5) },
            uTintTop: { value: new THREE.Color("#0962ec") },
            uTintBottom: { value: new THREE.Color("#a9d4ff") },
            uTintRange: { value: new THREE.Vector2(-1.3, 2.4) },
            uPointer: { value: new THREE.Vector2() },
            uFlow: { value: flowRead.texture },
            uMotion: { value: 1 },
          },
        });
        const footerMaterial = new THREE.ShaderMaterial({
          toneMapped: false,
          vertexShader: glassVertexShader,
          fragmentShader: glassFragmentShader,
          uniforms: {
            ...material.uniforms,
            uTintRange: { value: new THREE.Vector2(-0.5, 0.5) },
          },
        });
        // Separate from the lettering so decoration never changes its framing.
        const accentGroup = new THREE.Group();
        const accentMaterial = new THREE.ShaderMaterial({
          toneMapped: false,
          vertexShader: glassVertexShader,
          fragmentShader: glassFragmentShader,
          uniforms: {
            ...material.uniforms,
            uTintTop: { value: new THREE.Color("#6aa5e9") },
            uTintBottom: { value: new THREE.Color("#d1e9fa") },
            uTintRange: { value: new THREE.Vector2(-1, 1) },
          },
        });
        const accentGeometry = new THREE.SphereGeometry(1, 40, 24);
        // Trace into a central plane inside each sphere. The mark receives the
        // same absorption and reflections as the glass, rather than a decal.
        const orbVertexShader = glassVertexShader
          .replace("void main() {", "varying vec3 vOrbPosition;\nvoid main() {")
          .replace("vLocalHeight = position.y;", "vLocalHeight = position.y; vOrbPosition = position;");
        const orbFragmentShader = glassFragmentShader
          .replace("uniform sampler2D uScene;", `
            uniform sampler2D uScene;
            uniform sampler2D uLogo;
            uniform float uLogoStrength;
            varying vec3 vOrbPosition;
          `)
          .replace("vec3 color = transmitted * attenuation;", `
            vec3 insideRay = refract(-view, normal, 1.0 / 1.18);
            float travelToMark = -vOrbPosition.z / min(-0.01, insideRay.z);
            vec2 markUv = (vOrbPosition.xy + insideRay.xy * travelToMark) / 1.15 + 0.5;
            vec4 mark = texture2D(uLogo, clamp(markUv, 0.0, 1.0));
            float inMark = step(0.0, markUv.x) * step(markUv.x, 1.0)
                         * step(0.0, markUv.y) * step(markUv.y, 1.0);
            transmitted = mix(transmitted, mark.rgb, mark.a * inMark * uLogoStrength);
            vec3 color = transmitted * attenuation;
          `);
        const logoTextures: InstanceType<typeof THREE.Texture>[] = [];
        const logoMaterials: InstanceType<typeof THREE.ShaderMaterial>[] = [];
        const textureLoader = new THREE.TextureLoader();
        const accents = [
          { x: 0.17, y: 0.22, radius: 0.034, min: 26, max: 43, logo: "claude" },
          { x: 0.88, y: 0.79, radius: 0.040, min: 30, max: 51, logo: "codex" },
          { x: 0.73, y: 0.12, radius: 0.028, min: 24, max: 36, logo: "figma" },
        ].map((layout) => {
          let orbMaterial = accentMaterial;
          if (layout.logo) {
            orbMaterial = new THREE.ShaderMaterial({
              toneMapped: false,
              vertexShader: orbVertexShader,
              fragmentShader: orbFragmentShader,
              uniforms: {
                ...accentMaterial.uniforms,
                uLogo: { value: null },
                uLogoStrength: { value: 0 },
              },
            });
            const logoMaterial = orbMaterial;
            const texture = textureLoader.load(`/images/tools/${layout.logo}.svg`, () => {
              if (disposed) return;
              logoMaterial.uniforms.uLogoStrength.value = layout.logo === "figma" ? 0.66 : 0.78;
              element.dataset.glassLogos = String(
                logoMaterials.filter((entry) => entry.uniforms.uLogoStrength.value > 0).length,
              );
              resume();
            });
            texture.colorSpace = THREE.SRGBColorSpace;
            logoMaterial.uniforms.uLogo.value = texture;
            logoTextures.push(texture);
            logoMaterials.push(logoMaterial);
          }
          const mesh = new THREE.Mesh(accentGeometry, orbMaterial);
          accentGroup.add(mesh);
          return { ...layout, mesh, origin: new THREE.Vector3() };
        });
        scene.add(accentGroup);
        // Circular 3D writing paths use the hero's glass and tint palette.
        // The hero can render before the footer geometry has finished loading.
        const footerHeading = document.querySelector<HTMLElement>(
          "[data-footer-thanks]",
        );
        const footerGroup = new THREE.Group();
        const footerWords: {
          mesh: InstanceType<typeof THREE.Mesh>;
          extent: InstanceType<typeof THREE.Vector3>;
          baseline: number;
        }[] = [];
        footerGroup.visible = false;
        scene.add(footerGroup);
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const pointer = { x: 0, y: 0 };
        const pointerTarget = new THREE.Vector2();
        const lightTarget = new THREE.Vector3();
        let previousPointer: { x: number; y: number; time: number } | null =
          null;
        let inputStrength = 0;
        let previousTime = 0;
        let frame = 0;
        let visible = true;
        let exposed = true;
        let contextLost = false;
        let scrollTop = readScroll().top;
        let viewportHeight = readScroll().height;
        let contactVisible = false;
        let worldHeight = 1;
        let accentPixel = 1;
        let heroOffsetY = 0;
        const bounds = new THREE.Box3(new THREE.Vector3(-5, -1.1, -.2), new THREE.Vector3(5, 2.1, .2));
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const placeFooter = () => {
          if (!footerHeading) return;
          const { width, height } = element.getBoundingClientRect();
          const stacked = getComputedStyle(footerHeading).flexDirection === "column";
          footerWords.forEach(({ mesh, extent, baseline }, index) => {
            const span = footerHeading.children[index];
            if (!span) return;
            const rect = span.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(span);
            const textRect = range.getBoundingClientRect();
            const worldPixel = worldHeight / height;
            const scale = Math.min(
              textRect.width * worldPixel / extent.x,
              rect.height * worldPixel * 0.92 / extent.y,
            );
            const x = rect.left + rect.width / 2;
            // Inline words share the writing baseline, including y's descender.
            const y = stacked ? rect.top + rect.height / 2
              : rect.top + rect.height * 0.52 + baseline * scale / worldPixel;
            mesh.scale.setScalar(scale);
            mesh.position.set(
              center.x +
                (x / width - 0.5) *
                  worldHeight *
                  camera.aspect,
              center.y +
                (0.5 - y / height) * worldHeight,
              0,
            );
          });
        };
        const resize = () => {
          const { width, height } = element.getBoundingClientRect();
          // Narrow glass reflections need more than coverage MSAA at DPR 1.
          // Supersample the footer, with a pixel budget for large displays.
          const footerPixelRatio = Math.max(
            nativePixelRatio,
            Math.min(2, Math.sqrt(4_000_000 / Math.max(1, width * height))),
          );
          const pixelRatio = contactVisible ? footerPixelRatio : nativePixelRatio;
          if (renderer.getPixelRatio() !== pixelRatio)
            renderer.setPixelRatio(pixelRatio);
          renderer.setSize(width, height);
          renderer.getDrawingBufferSize(material.uniforms.uResolution.value);
          refractionTarget.setSize(
            Math.max(1, Math.round(material.uniforms.uResolution.value.x)),
            Math.max(1, Math.round(material.uniforms.uResolution.value.y)),
          );
          sceneTarget.setSize(refractionTarget.width, refractionTarget.height);
          backSurfaceTarget.setSize(
            refractionTarget.width,
            refractionTarget.height,
          );
          flareTarget.setSize(
            Math.max(1, Math.round(refractionTarget.width * 0.5)),
            Math.max(1, Math.round(refractionTarget.height * 0.5)),
          );
          flareMaterial.uniforms.uResolution.value.copy(
            material.uniforms.uResolution.value,
          );
          const flowWidth = Math.max(
            64,
            Math.round((256 * width) / Math.max(width, height)),
          );
          const flowHeight = Math.max(
            64,
            Math.round((256 * height) / Math.max(width, height)),
          );
          flowRead.setSize(flowWidth, flowHeight);
          flowWrite.setSize(flowWidth, flowHeight);
          flowProjection.resize(flowWidth, flowHeight);
          flowMaterial.uniforms.uTexel.value.set(1 / flowWidth, 1 / flowHeight);
          flowMaterial.uniforms.uAspect.value = width / Math.max(height, 1);
          renderer.setClearColor(0x000000, 0);
          for (const target of [flowRead, flowWrite]) {
            renderer.setRenderTarget(target);
            renderer.clear();
          }
          renderer.setRenderTarget(null);
          renderer.setClearColor("#beddeb", 1);
          backdropMaterial.uniforms.uResolution.value.copy(
            material.uniforms.uResolution.value,
          );
          camera.aspect = width / Math.max(height, 1);
          const halfFov = (camera.fov * Math.PI) / 360;
          const hero = document.querySelector<HTMLElement>("[data-hero]");
          const heroTop = hero?.getBoundingClientRect().top ?? 0;
          const letteringFrame = hero
            ?.querySelector("[data-hero-lettering-frame]")
            ?.getBoundingClientRect();
          // Fit the real lettering to the layout's middle row. Typography and
          // the introduction reserve their space on every viewport, not just
          // on short landscape screens.
          const frameTop = letteringFrame ? letteringFrame.top - heroTop : 0;
          const frameBottom = letteringFrame
            ? letteringFrame.bottom - heroTop
            : height;
          const frameHeight = Math.max(64, frameBottom - frameTop);
          const fitHeight = ((size.y * height) / frameHeight) * 1.12;
          const widthMargin = contactVisible ? (width <= 760 ? 1.24 : 1.7) : 1.12;
          const distance =
            Math.max(fitHeight, (size.x / camera.aspect) * widthMargin) /
              (2 * Math.tan(halfFov)) +
            size.z / 2;
          camera.position.set(center.x, center.y, distance);
          backSurfaceMaterial.uniforms.uDepthOrigin.value = distance;
          // Portrait framing places the wider word beyond the original 100-unit
          // far plane. Keep both lettering and its backdrop inside the frustum.
          camera.far = Math.max(100, distance * 3);
          camera.updateProjectionMatrix();
          worldHeight = 2 * Math.tan(halfFov) * distance;
          heroOffsetY =
            (0.5 - (frameTop + frameBottom) / (2 * height)) * worldHeight;
          accentPixel = worldHeight / height;
          accents.forEach((accent) => {
            const y = frameTop + frameHeight * accent.y;
            accent.origin.set(
              center.x + (accent.x - 0.5) * worldHeight * camera.aspect,
              center.y + (0.5 - y / height) * worldHeight,
              0,
            );
            const radius = THREE.MathUtils.clamp(width * accent.radius, accent.min, accent.max);
            accent.mesh.scale.setScalar(radius * accentPixel);
          });
          backdrop.position.x = center.x;
          backdrop.position.y = center.y;
          const viewHeight =
            2 * Math.tan(halfFov) * (distance - backdrop.position.z);
          backdrop.scale.set(viewHeight * camera.aspect, viewHeight, 1);
          backdropMaterial.uniforms.uAspect.value = camera.aspect;
          placeFooter();
        };
        const move = (event: PointerEvent) => {
          if (event.pointerType === "touch" || motion.matches || !exposed)
            return;
          const rect = element.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = 1 - (event.clientY - rect.top) / rect.height;
          const now = performance.now();
          pointer.x = x - 0.5;
          pointer.y = 0.5 - y;
          if (previousPointer) {
            const dx = Math.max(-0.18, Math.min(0.18, x - previousPointer.x));
            const dy = Math.max(-0.18, Math.min(0.18, y - previousPointer.y));
            if (Math.hypot(dx, dy) > 0.0005) {
              const dt = Math.max(1 / 120, (now - previousPointer.time) / 1000);
              flowMaterial.uniforms.uVelocity.value
                .set(dx / dt, dy / dt)
                .clampLength(0, 0.85);
              flowMaterial.uniforms.uPointer.value.set(x, y);
              inputStrength = 1;
            }
          }
          previousPointer = { x, y, time: now };
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
          inputStrength = motion.matches
            ? 0
            : inputStrength * Math.exp(-dt * 9.0);
          element.dataset.pointerEnergy = inputStrength.toFixed(3);
          const motionEnabled = motion.matches ? 0 : 1;
          flowMaterial.uniforms.uPrevious.value = flowRead.texture;
          flowMaterial.uniforms.uImpulse.value = inputStrength;
          flowMaterial.uniforms.uDt.value = dt;
          renderer.setRenderTarget(flowWrite);
          renderer.render(flowScene, displayCamera);
          if (motionEnabled && navigator.maxTouchPoints === 0) {
            flowProjection.project(flowWrite.texture, flowRead, dt);
          } else {
            [flowRead, flowWrite] = [flowWrite, flowRead];
          }
          backdropMaterial.uniforms.uFlow.value = flowRead.texture;
          backdropMaterial.uniforms.uMotion.value = motionEnabled;
          material.uniforms.uFlow.value = flowRead.texture;
          material.uniforms.uMotion.value = motionEnabled;
          material.uniforms.uPointer.value.lerp(
            pointerTarget.set(pointer.x, pointer.y),
            1 - Math.exp(-8 * dt),
          );
          if (!motion.matches) {
            material.uniforms.uLight.value.lerp(
              lightTarget.set(
                center.x + pointer.x * worldHeight * 0.75,
                center.y - pointer.y * worldHeight * 0.75 + 1,
                7,
              ),
              1 - Math.exp(-8 * dt),
            );
            group.rotation.y +=
              (0.07 +
                Math.min(1, scrollTop / viewportHeight) * 1.64 +
                pointer.x * 0.16 -
                group.rotation.y) *
              0.08;
            group.rotation.x += (pointer.y * 0.12 - group.rotation.x) * 0.035;
            group.position.y =
              -0.4 +
              heroOffsetY +
              (scrollTop / viewportHeight) * worldHeight * 0.72 +
              Math.sin(time * 0.00065) * 0.07;
            footerWords.forEach(({ mesh }) => {
              mesh.rotation.x +=
                (pointer.y * 0.12 - mesh.rotation.x) * 0.08;
              mesh.rotation.y +=
                (0.07 + pointer.x * 0.2 - mesh.rotation.y) * 0.08;
            });
          } else {
            leave();
            material.uniforms.uLight.value.set(4, 9, 5);
            group.position.y =
              -0.4 +
              heroOffsetY +
              (scrollTop / viewportHeight) * worldHeight * 0.72;
          }
          accentGroup.position.y = (scrollTop / viewportHeight) * worldHeight * 0.72;
          accents.forEach(({ mesh, origin }, index) => {
            const drift = motion.matches ? 0 : Math.sin(time * 0.00045 + index * 2.1) * 2;
            const parallax = motion.matches ? 0 : 5 / (index + 1);
            mesh.position.copy(origin);
            mesh.position.x += material.uniforms.uPointer.value.x * parallax * accentPixel;
            mesh.position.y += (drift - material.uniforms.uPointer.value.y * parallax) * accentPixel;
          });
          // Measure the rear interface before sampling transmission. This data
          // pass contains only the currently visible lettering, never the sky.
          group.visible = !contactVisible;
          accentGroup.visible = !contactVisible;
          footerGroup.visible = contactVisible;
          backdrop.visible = false;
          scene.overrideMaterial = backSurfaceMaterial;
          renderer.setClearColor(0x000000, 0);
          renderer.setRenderTarget(backSurfaceTarget);
          renderer.render(scene, camera);
          scene.overrideMaterial = null;
          backdrop.visible = true;
          renderer.setClearColor("#beddeb", 1);
          // Render the backdrop first, excluding the glass from its own texture.
          group.visible = false;
          accentGroup.visible = false;
          footerGroup.visible = false;
          renderer.setRenderTarget(refractionTarget);
          renderer.render(scene, camera);
          group.visible = !contactVisible;
          accentGroup.visible = !contactVisible;
          footerGroup.visible = contactVisible;
          element.dataset.scene = contactVisible ? "thank-you" : "hello";
          renderer.setRenderTarget(sceneTarget);
          renderer.render(scene, camera);
          renderer.setRenderTarget(flareTarget);
          renderer.render(flareScene, displayCamera);
          renderer.setRenderTarget(null);
          renderer.render(displayScene, displayCamera);
          if (
            footerWords.length === 2 &&
            !footerHeading?.hasAttribute("data-glass-ready")
          )
            footerHeading?.setAttribute("data-glass-ready", "true");
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
          const wasContactVisible = contactVisible;
          contactVisible = footerTop < viewportHeight;
          if (wasContactVisible !== contactVisible) resize();
          else if (contactVisible) placeFooter();
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
          setFailed(true);
          footerHeading?.removeAttribute("data-glass-ready");
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
          render(performance.now());
          resume();
          setReady(true);
          setFailed(false);
        };
        renderer.domElement.addEventListener("webglcontextlost", lost);
        renderer.domElement.addEventListener("webglcontextrestored", restored);
        resize();
        render(0);
        setFailed(false);
        import("three/addons/loaders/GLTFLoader.js")
          .then(({ GLTFLoader }) => {
            const loader = new GLTFLoader();
            void loader
              .loadAsync("/models/hello.glb")
              .then((gltf) => {
                let geometry: InstanceType<typeof THREE.BufferGeometry> | null =
                  null;
                gltf.scene.traverse((object) => {
                  if (!(object instanceof THREE.Mesh)) return;
                  const sourceMaterials = Array.isArray(object.material)
                    ? object.material
                    : [object.material];
                  sourceMaterials.forEach((entry) => entry.dispose());
                  if (disposed) object.geometry.dispose();
                  else geometry = object.geometry;
                });
                if (disposed || !geometry) return;
                const previous = new Set<
                  InstanceType<typeof THREE.BufferGeometry>
                >();
                group.traverse((object) => {
                  if (object instanceof THREE.Mesh)
                    previous.add(object.geometry);
                });
                group.clear();
                previous.forEach((entry) => entry.dispose());
                group.add(new THREE.Mesh(geometry, material));
                const savedY = group.position.y;
                group.position.y = -0.4;
                group.updateMatrixWorld(true);
                bounds.setFromObject(group);
                bounds.getSize(size);
                bounds.getCenter(center);
                group.position.y = savedY;
                group.updateMatrixWorld(true);
                element.dataset.helloGeometry = "glass-mesh";
              })
              .catch(() => {
                // Keep a licensed HTML text fallback if geometry cannot load.
                element.dataset.helloGeometry = "unavailable";
                setFailed(true);
              })
              .finally(() => {
                if (disposed) return;
                cancelAnimationFrame(frame);
                frame = 0;
                resize();
                render(performance.now());
                setReady(true);
              });
            return loader.loadAsync("/models/thank-you.glb");
          })
          .then((gltf) => {
            gltf.scene.traverse((object) => {
              if (!(object instanceof THREE.Mesh)) return;
              const materials = Array.isArray(object.material)
                ? object.material
                : [object.material];
              materials.forEach((entry) => entry.dispose());
              if (disposed) object.geometry.dispose();
            });
            if (disposed) return;
            for (const word of ["THANK", "YOU"]) {
              const mesh = gltf.scene.getObjectByName(word);
              if (!(mesh instanceof THREE.Mesh))
                throw new Error("Missing footer lettering mesh");
              mesh.material = footerMaterial;
              mesh.geometry.computeBoundingBox();
              const extent = mesh.geometry.boundingBox!.getSize(
                new THREE.Vector3(),
              );
              mesh.rotation.set(0, 0.07, 0);
              footerGroup.add(mesh);
              footerWords.push({ mesh, extent, baseline: mesh.userData.baseline });
            }
            element.dataset.footerGeometry = "glass-path";
            placeFooter();
            resume();
          })
          .catch(() => {
            // The semantic heading stays readable if the model cannot load.
            footerHeading?.removeAttribute("data-glass-ready");
          });
        document.fonts.ready.then(() => {
          if (!disposed) {
            resize();
            resume();
          }
        });
        cleanup = () => {
          footerHeading?.removeAttribute("data-glass-ready");
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
          for (const lettering of [group, footerGroup, accentGroup])
            lettering.traverse((object) => {
              if (object instanceof THREE.Mesh)
                usedGeometry.add(object.geometry);
            });
          usedGeometry.forEach((geometry) => geometry.dispose());
          material.dispose();
          footerMaterial.dispose();
          accentMaterial.dispose();
          logoMaterials.forEach((entry) => entry.dispose());
          logoTextures.forEach((entry) => entry.dispose());
          flareMaterial.dispose();
          flareTarget.dispose();
          flowProjection.dispose();
          studio.dispose();
          backdropGeometry.dispose();
          backdropMaterial.dispose();
          refractionTarget.dispose();
          backSurfaceTarget.dispose();
          backSurfaceMaterial.dispose();
          sceneTarget.dispose();
          flowRead.dispose();
          flowWrite.dispose();
          flowMaterial.dispose();
          displayMaterial.dispose();
          displayGeometry.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      })
      .catch(() => {
        if (!disposed) setFailed(true);
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
      data-failed={failed}
      data-lighting="studio-environment"
      aria-hidden="true"
    >
      {failed && <span className={styles.glassFallback}>hello</span>}
    </div>
  );
}
