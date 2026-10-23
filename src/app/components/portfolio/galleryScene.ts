import * as THREE from "three";
import { registerGalleryFlight } from "./galleryBridge";

const radius = 6;
const ellipse = 2.25;
// Compress the depth after rotation so adjacent frames pass like a shallow
// ribbon, rather than disappearing around the sides of a round drum.
const depthScale = 0.55;
const frontZ = radius * depthScale;
const slots = 8;
const step = (Math.PI * 2) / slots;
const arc = step - 0.004;
const width = radius * arc * ellipse;
const height = width / 1.5;
const bottomY = 0.16;
const centerY = height / 2 + bottomY;
const vertex = `
uniform float uRadius;
uniform float uFlight;
uniform float uSelected;
uniform vec4 uView;
uniform vec4 uTarget;
varying vec2 vUv;
varying float vDistance;
varying float vScreenY;
varying vec3 vNormal;
void main() {
  vUv=uv;
  float theta=position.x/uRadius;
  vec3 bent=vec3(sin(theta)*uRadius,position.y,(cos(theta)-1.)*uRadius);
  vNormal=normalize(normalMatrix*vec3(sin(theta),0.,cos(theta)));
  vec4 view=modelViewMatrix*vec4(bent,1.);
  vDistance=length(view.xyz);
  vec4 projected=projectionMatrix*view;
  vScreenY=projected.y/projected.w*.5+.5;
  vec2 ndc=projected.xy/projected.w;
  ndc=uView.xy+(ndc*.5+.5)*uView.zw;
  ndc=ndc*2.-1.;
  float unfold=smoothstep(.06,1.,uFlight)*uSelected;
  vec2 destination=uTarget.xy+uv*uTarget.zw;
  gl_Position=vec4(mix(ndc,destination*2.-1.,unfold),projected.z/projected.w,1.);
}`;
const fragment = `
uniform sampler2D uMap;
uniform float uFlight;
uniform float uSelected;
uniform float uReflection;
uniform float uTime;
uniform float uFogStart;
varying vec2 vUv;
varying float vDistance;
varying float vScreenY;
varying vec3 vNormal;
void main() {
  vec2 uv=vUv;
  if(uReflection>.5) {
    float distance=pow(uv.y,1.4);
    uv.x+=sin(uv.y*54.+uTime*.45)*.0035*distance;
    uv.y+=sin(uv.x*22.+uv.y*36.+uTime*.25)*.002*distance;
  }
  vec3 color=texture2D(uMap,uv).rgb;
  if(uReflection>.5) {
    // A short, soft reflection reuses the image texture: no second scene render.
    float blur=.001+pow(uv.y,1.3)*.012;
    color=color*.4
      +texture2D(uMap,clamp(uv+vec2(blur,blur*.4),0.,1.)).rgb*.15
      +texture2D(uMap,clamp(uv-vec2(blur,blur*.4),0.,1.)).rgb*.15
      +texture2D(uMap,clamp(uv+vec2(-blur,blur*.4),0.,1.)).rgb*.15
      +texture2D(uMap,clamp(uv+vec2(blur,-blur*.4),0.,1.)).rgb*.15;
  } else {
    vec2 px=fwidth(vUv)*1.2;
    float rim=1.-smoothstep(0.,1.,min(min(vUv.x/px.x,(1.-vUv.x)/px.x),min(vUv.y/px.y,(1.-vUv.y)/px.y)));
    float grazing=pow(1.-abs(normalize(vNormal).z),2.);
    color=mix(color,vec3(.83,.9,.98),grazing*.055*(1.-uFlight));
    color=mix(color,vec3(.8,.87,.94),rim*.45*(1.-uFlight));
  }
  float edge=smoothstep(0.,.001,vUv.x)*smoothstep(0.,.001,1.-vUv.x);
  float fog=1.-exp(-max(0.,vDistance-uFogStart)*.018);
  color=mix(color,vec3(.905,.930,.956),fog*(1.-uFlight));
  float alpha=edge;
  if(uSelected<.5) alpha*=1.-smoothstep(0.,.48,uFlight);
  if(uReflection>.5) {
    color=mix(color,vec3(.905,.930,.956),.12);
    alpha*=.42*pow(1.-vUv.y,2.1)*(1.-smoothstep(.58,.95,vUv.y))*smoothstep(0.,.1,vScreenY)*(1.-smoothstep(0.,.5,uFlight));
  }
  if(alpha<.001) discard;
  gl_FragColor=vec4(color,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export type GalleryFlight = {
  arrive: (target: HTMLElement, reverse?: boolean) => Promise<void>;
  cancel: () => void;
};

export class GalleryScene {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  private group = new THREE.Group();
  private geometry = new THREE.PlaneGeometry(width / ellipse, height, 64, 1);
  private panels: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  private textures = new Map<number, THREE.Texture>();
  private host: HTMLElement | null = null;
  private lastHost: HTMLElement | null = null;
  private lastBounds: DOMRect | null = null;
  private ids: number[] = [];
  private current = 0;
  private target = 0;
  private selected = 1;
  private visible = false;
  private autoplay = false;
  private reduced = false;
  private pauseUntil = 0;
  private frame = 0;
  private previousTime = 0;
  private lastDrawTime = 0;
  private dragStart: { angle: number; pixels: number; time: number } | null =
    null;
  private velocity = 0;
  private inertia = false;
  private manualSelection = false;
  private callback: (id: number) => void = () => {};
  private observer: ResizeObserver;
  private flight: {
    root: HTMLElement;
    background: HTMLElement;
    source: DOMRect;
    target: DOMRect;
    progress: number;
    cancel: () => void;
  } | null = null;
  private baseDistance = 9;
  private cameraTargetY = 1.1;
  private raycaster = new THREE.Raycaster();
  private ticket = 0;
  private pauseTimer = 0;
  private entranceAt = 0;

  constructor() {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute("data-curved-gallery-canvas", "");
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    this.renderer.domElement.style.cssText =
      "display:block;width:100%;height:100%;pointer-events:none";
    const space = new THREE.Group();
    space.scale.x = ellipse;
    space.scale.z = depthScale;
    space.add(this.group);
    this.scene.add(space);
    registerGalleryFlight((root, from, id) => this.beginFlight(root, from, id));
    this.observer = new ResizeObserver(() => {
      if (!this.flight) this.resize();
    });
  }

  async attach(
    host: HTMLElement,
    ids: number[],
    selected: number,
    callback: (id: number) => void,
  ) {
    const ticket = ++this.ticket;
    this.host = host;
    this.lastHost = host;
    this.callback = callback;
    const textures = await Promise.all(
      ids.map(async (id) => {
        let texture = this.textures.get(id);
        if (!texture) {
          texture = await new THREE.TextureLoader().loadAsync(
            `/projects/gallery/${id}.webp`,
          );
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(
            8,
            this.renderer.capabilities.getMaxAnisotropy(),
          );
          this.textures.set(id, texture);
        }
        return texture;
      }),
    );
    if (ticket !== this.ticket || this.host !== host) return;
    const sameSelection =
      this.ids.join(",") === ids.join(",") && this.selected === selected;
    this.ids = ids;
    this.selected = selected;
    // Repeated works form a shallow elliptical ribbon. The number of surfaces
    // remains fixed when a filter reduces the set to two projects.
    for (let i = 0; i < slots; i++) {
      const id = ids[i % ids.length];
      for (const reflection of [false, true]) {
        let mesh = this.panels[i * 2 + (reflection ? 1 : 0)];
        if (!mesh) {
          const material = new THREE.ShaderMaterial({
            vertexShader: vertex,
            fragmentShader: fragment,
            transparent: true,
            side: THREE.FrontSide,
            depthWrite: !reflection,
            uniforms: {
              uRadius: { value: radius },
              uMap: { value: textures[i % ids.length] },
              uFlight: { value: 0 },
              uSelected: {
                value:
                  this.flight && i === this.selectedSlot() && !reflection
                    ? 1
                    : 0,
              },
              uReflection: { value: reflection ? 1 : 0 },
              uTime: { value: 0 },
              uFogStart: { value: 14 },
              uView: { value: new THREE.Vector4(0, 0, 1, 1) },
              uTarget: { value: new THREE.Vector4(0, 0, 1, 1) },
            },
          });
          mesh = new THREE.Mesh(this.geometry, material);
          const angle = i * step;
          mesh.position.set(
            Math.sin(angle) * radius,
            reflection ? bottomY * 2 - centerY : centerY,
            Math.cos(angle) * radius,
          );
          mesh.rotation.y = angle;
          if (reflection) {
            const compression = 0.46;
            mesh.scale.y = -compression;
            // Keep the reflection just below the artwork, with a tiny clear seam.
            mesh.position.y = bottomY - 0.025 - (height * compression) / 2;
          }
          // Paint the artwork after every reflection, including adjacent panels.
          mesh.renderOrder = reflection ? 0 : 1;
          mesh.userData = { id, slot: i, reflection };
          // The visual bend is performed in the vertex shader; do not cull using
          // the unbent plane's bounds. Picking below uses the cylinder directly.
          mesh.frustumCulled = false;
          this.group.add(mesh);
          this.panels.push(mesh);
        }
        // Filter/route changes only replace textures and selection. Geometry,
        // meshes and their compiled material programs stay alive with the scene.
        mesh.userData.id = id;
        mesh.material.uniforms.uMap.value = textures[i % ids.length];
      }
    }
    const slot = ids.indexOf(selected);
    if (!sameSelection) {
      this.current = this.target = -Math.max(0, slot) * step;
      this.manualSelection = false;
    }
    const selectedSlot = this.selectedSlot();
    this.panels.forEach((mesh) => {
      mesh.material.uniforms.uSelected.value =
        this.flight &&
        mesh.userData.slot === selectedSlot &&
        !mesh.userData.reflection
          ? 1
          : 0;
    });
    if (this.flight) {
      host.dataset.ready = "true";
      this.applyFlight(this.flight.progress);
      return;
    }
    host.append(this.renderer.domElement);
    this.observer.disconnect();
    this.observer.observe(host);
    host.dataset.ready = "true";
    this.resize();
  }

  detach(host: HTMLElement) {
    if (this.host !== host) return;
    this.host = null;
    this.entranceAt = 0;
    this.observer.disconnect();
    if (!this.flight) {
      this.visible = false;
      this.stop();
      this.renderer.domElement.remove();
    }
  }
  setVisible(value: boolean) {
    this.visible = value;
    if (value) this.wake();
    else if (!this.flight) this.stop();
  }
  setAutoplay(value: boolean) {
    this.autoplay = value;
    this.wake();
  }
  setReduced(value: boolean) {
    this.reduced = value;
    if (value) this.finishEntrance();
    if (value) this.current = this.target;
    this.wake();
  }
  enter() {
    if (this.reduced || this.flight) return;
    this.entranceAt = performance.now();
    this.draw(this.entranceAt);
    this.wake();
  }
  finishEntrance() {
    if (!this.entranceAt) return;
    this.entranceAt = 0;
    if (this.host && !this.flight) this.draw(performance.now());
  }
  select(id: number) {
    if (this.selected === id) return;
    const index = this.ids.indexOf(id);
    if (index < 0) return;
    this.pause();
    this.selected = id;
    this.inertia = false;
    this.manualSelection = true;
    const desired = -index * step;
    const period = this.ids.length * step;
    this.target =
      desired + Math.round((this.current - desired) / period) * period;
    if (this.reduced) this.current = this.target;
    this.wake();
  }
  drag(pixels: number) {
    if (this.flight) return;
    this.pause();
    const now = performance.now();
    if (!this.dragStart) {
      this.stop();
      this.inertia = false;
      this.manualSelection = false;
      this.dragStart = { angle: this.current, pixels: 0, time: now - 16 };
      this.velocity = 0;
    }
    const factor = 1.65 / Math.max(300, this.host?.clientWidth ?? 1000);
    const elapsed = Math.max(0.016, (now - this.dragStart.time) / 1000);
    this.velocity = THREE.MathUtils.lerp(
      this.velocity,
      ((pixels - this.dragStart.pixels) * factor) / elapsed,
      0.65,
    );
    this.current = this.dragStart.angle + pixels * factor;
    this.target = this.current;
    this.dragStart.pixels = pixels;
    this.dragStart.time = now;
    this.notifyNearest();
    this.draw(performance.now());
  }
  release(cancelled = false) {
    if (!this.dragStart) return;
    this.dragStart = null;
    if (this.reduced) {
      this.inertia = false;
      this.velocity = 0;
      return;
    }
    this.inertia = true;
    this.velocity = cancelled
      ? 0
      : THREE.MathUtils.clamp(this.velocity, -1.6, 1.6);
    this.previousTime = 0;
    this.wake();
  }
  private notifyNearest() {
    const slot = ((Math.round(-this.current / step) % slots) + slots) % slots;
    const id = this.ids[slot % this.ids.length];
    if (id && id !== this.selected) {
      this.selected = id;
      this.callback(id);
    }
  }
  private selectedSlot() {
    let nearest = 0,
      distance = Infinity;
    for (let i = 0; i < slots; i++) {
      if (this.ids[i % this.ids.length] !== this.selected) continue;
      const angle = i * step + this.current;
      const diff = Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle)));
      if (diff < distance) {
        nearest = i;
        distance = diff;
      }
    }
    return nearest;
  }
  pause() {
    this.pauseUntil = performance.now() + 2200;
    window.clearTimeout(this.pauseTimer);
    this.pauseTimer = window.setTimeout(() => this.wake(), 2250);
  }

  pick(x: number, y: number): number | null {
    if (!this.host || this.flight) return null;
    const rect = this.host.getBoundingClientRect();
    this.raycaster.setFromCamera(
      new THREE.Vector2(
        ((x - rect.left) / rect.width) * 2 - 1,
        (-(y - rect.top) / rect.height) * 2 + 1,
      ),
      this.camera,
    );
    const ray = this.raycaster.ray;
    const a =
      (ray.direction.x / ellipse) ** 2 + (ray.direction.z / depthScale) ** 2;
    const b =
      2 *
      ((ray.origin.x * ray.direction.x) / (ellipse * ellipse) +
        (ray.origin.z * ray.direction.z) / depthScale ** 2);
    const c =
      (ray.origin.x / ellipse) ** 2 +
      (ray.origin.z / depthScale) ** 2 -
      radius ** 2;
    const d = b * b - 4 * a * c;
    if (d < 0) return null;
    const t = (-b - Math.sqrt(d)) / (2 * a);
    if (t < 0) return null;
    const point = ray.at(t, new THREE.Vector3());
    if (Math.abs(point.y - centerY) > height / 2) return null;
    const angle =
      Math.atan2(point.x / ellipse, point.z / depthScale) - this.current;
    const slot = ((Math.round(angle / step) % slots) + slots) % slots;
    const local = angle - slot * step;
    const wrapped = Math.atan2(Math.sin(local), Math.cos(local));
    return Math.abs(wrapped) <= arc / 2
      ? this.ids[slot % this.ids.length]
      : null;
  }

  private sizeRenderer(w: number, h: number) {
    // Resolve high-DPI text and artwork while bounding fill rate, including flight.
    const pixelBudget = Math.sqrt(1_500_000 / (w * h));
    this.renderer.setDrawingBufferSize(
      w,
      h,
      Math.min(devicePixelRatio, 2, pixelBudget),
    );
  }
  private resize() {
    if (!this.host || this.flight) return;
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h) return;
    this.sizeRenderer(w, h);
    this.camera.aspect = w / h;
    // A level camera keeps the top and bottom edges steady while frames pass.
    // Fit the nearest part of the ribbon, including the seam between projects,
    // rather than only the initially selected flat frame.
    const halfFov = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    // Reserve the lower part of the viewport for the reflection rather than
    // fitting only the artwork and cutting its reflected edge at the canvas.
    const verticalFit = height / (2 * halfFov * 0.68);
    this.baseDistance = Math.max(
      w < 760 ? Math.max(7.1, verticalFit) : verticalFit,
      (width * 0.97) / (2 * halfFov * (w / h) * (w < 760 ? 0.9 : 1.16)),
    );
    this.cameraTargetY = centerY - height * 0.16;
    this.camera.position.set(0, this.cameraTargetY, frontZ + this.baseDistance);
    this.camera.lookAt(0, this.cameraTargetY, 0);
    this.camera.updateProjectionMatrix();
    this.panels.forEach((mesh) => {
      mesh.material.uniforms.uView.value.set(0, 0, 1, 1);
      mesh.material.uniforms.uFlight.value = 0;
      mesh.material.uniforms.uFogStart.value = this.baseDistance + 2;
    });
    this.draw(performance.now());
    this.wake();
  }
  private stop() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.previousTime = 0;
  }
  private wake() {
    if (
      this.frame ||
      this.flight ||
      this.dragStart ||
      !this.visible ||
      document.hidden
    )
      return;
    this.frame = requestAnimationFrame(this.tick);
  }
  private tick = (time: number) => {
    this.frame = 0;
    if (!this.visible || this.flight || document.hidden) {
      this.previousTime = 0;
      return;
    }
    const delta = this.previousTime
      ? Math.min(0.05, (time - this.previousTime) / 1000)
      : 1 / 60;
    this.previousTime = time;
    const auto =
      this.autoplay &&
      !this.reduced &&
      !this.entranceAt &&
      time > this.pauseUntil;
    if (this.manualSelection) {
      this.current = THREE.MathUtils.damp(this.current, this.target, 6, delta);
      if (Math.abs(this.current - this.target) < 0.0001)
        this.manualSelection = false;
    } else if (this.inertia) {
      this.current += this.velocity * delta;
      const cruising = this.autoplay && !this.reduced ? -0.085 : 0;
      this.velocity = THREE.MathUtils.damp(this.velocity, cruising, 5.2, delta);
      this.target = this.current;
      if (
        Math.abs(this.velocity - cruising) < 0.001 &&
        (auto || !this.autoplay)
      )
        this.inertia = false;
    } else if (auto) {
      this.current -= delta * 0.085;
      this.target = this.current;
    } else
      this.current = THREE.MathUtils.damp(this.current, this.target, 6, delta);
    if (!this.manualSelection && (auto || this.inertia)) this.notifyNearest();
    // Tolerance avoids skipping every other frame on a nominal 60 Hz display.
    const interval = 1000 / 60 - 1;
    if (!auto || time - this.lastDrawTime >= interval) this.draw(time);
    if (
      this.entranceAt ||
      auto ||
      this.inertia ||
      Math.abs(this.current - this.target) > 0.0001
    )
      this.wake();
    else {
      // A single timer wakes the idle scene after interaction, rather than a
      // permanent RAF while a reader is looking at the description.
      this.previousTime = 0;
    }
  };
  private draw(time: number) {
    this.lastDrawTime = time;
    const entry = this.entranceAt
      ? Math.min(1, (time - this.entranceAt) / 850)
      : 1;
    // A short real arc movement shares the existing draw loop and reflection.
    this.group.rotation.y = this.current + 0.16 * Math.pow(1 - entry, 3);
    if (entry === 1) this.entranceAt = 0;
    const visibleEdge = Math.cos(
      Math.acos(frontZ / this.camera.position.z) + arc / 2 + 0.12,
    );
    this.panels.forEach((mesh) => {
      mesh.material.uniforms.uTime.value = time / 1000;
      // The shader bends a flat plane onto an ellipse, so its original bounds
      // cannot be used for frustum culling. Exclude an arc only when even its
      // nearest edge is behind the camera-facing part of the ellipse. The
      // extra margin preserves grazing neighbor frames throughout a drag.
      const angle = mesh.userData.slot * step + this.group.rotation.y;
      mesh.visible =
        Math.cos(angle) > visibleEdge ||
        (!!this.flight && mesh.material.uniforms.uSelected.value > 0);
    });
    this.renderer.render(this.scene, this.camera);
  }

  beginFlight(
    root: HTMLElement,
    from?: HTMLElement,
    id?: number,
  ): GalleryFlight | null {
    if (!this.panels.length || this.flight) return null;
    if (id && !this.ids.includes(id)) return null;
    if (id) this.select(id);
    if (from) {
      // A detail can change without visiting the gallery. Align its current
      // image before unfolding back, rather than rotating after arrival.
      this.current = this.target = -this.selectedSlot() * step;
      this.manualSelection = false;
      this.inertia = false;
    }
    const measured = this.host?.getBoundingClientRect();
    const source = measured?.width ? measured : this.lastBounds;
    if (!source || source.width < 1) return null;
    this.lastBounds = source;
    this.stop();
    const background = document.createElement("div");
    background.style.cssText =
      "position:absolute;background:radial-gradient(ellipse 55% 23% at 50% 75%,#c9d9e526,transparent);pointer-events:none";
    root.append(background, this.renderer.domElement);
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.inset = "0";
    this.sizeRenderer(innerWidth, innerHeight);
    this.renderer.setScissorTest(false);
    this.panels.forEach((mesh) => {
      mesh.material.uniforms.uSelected.value =
        mesh.userData.slot === this.selectedSlot() && !mesh.userData.reflection
          ? 1
          : 0;
    });
    let cancelAnimation = () => {};
    this.flight = {
      root,
      background,
      source,
      target: from?.getBoundingClientRect() ?? source,
      progress: from ? 1 : 0,
      cancel: () => cancelAnimation(),
    };
    const initial = this.flight;
    this.applyFlight(initial.progress);
    if (!from) {
      const started = performance.now();
      let raf = 0;
      const advance = (now: number) => {
        if (this.flight !== initial) return;
        const elapsed = Math.min(1, (now - started) / 260);
        this.applyFlight(elapsed * 0.055);
        if (elapsed < 1) raf = requestAnimationFrame(advance);
      };
      raf = requestAnimationFrame(advance);
      cancelAnimation = () => cancelAnimationFrame(raf);
    }
    const cleanup = () => {
      if (this.flight !== initial) return;
      cancelAnimation();
      this.flight = null;
      this.renderer.setScissorTest(false);
      background.remove();
      this.renderer.domElement.style.position = "";
      this.renderer.domElement.style.inset = "";
      if (this.host?.isConnected) {
        this.host.append(this.renderer.domElement);
        this.host.dataset.ready = "true";
        this.observer.observe(this.host);
        this.resize();
      } else {
        this.renderer.domElement.remove();
        this.renderer.setSize(1, 1, false);
      }
    };
    return {
      cancel: cleanup,
      arrive: async (target, reverse = false) => {
        if (this.flight !== initial) return;
        cancelAnimation();
        const initialProgress = initial.progress;
        if (reverse) {
          const gallery = document.querySelector<HTMLElement>(
            "[data-gallery-canvas]",
          );
          if (gallery) initial.source = gallery.getBoundingClientRect();
        } else initial.target = target.getBoundingClientRect();
        const previous = target.style.visibility;
        if (!reverse) target.style.visibility = "hidden";
        await new Promise<void>((resolve) => {
          const started = performance.now();
          let raf = 0;
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            cancelAnimationFrame(raf);
            target.style.visibility = previous;
            resolve();
          };
          cancelAnimation = finish;
          const step = (now: number) => {
            if (this.flight !== initial) {
              finish();
              return;
            }
            const t = Math.min(1, (now - started) / 1050);
            const eased = t * t * (3 - 2 * t);
            this.applyFlight(
              reverse
                ? 1 - eased
                : initialProgress + (1 - initialProgress) * eased,
            );
            if (t < 1) raf = requestAnimationFrame(step);
            else finish();
          };
          raf = requestAnimationFrame(step);
        });
        cleanup();
      },
    };
  }
  private applyFlight(progress: number) {
    const flight = this.flight;
    if (!flight) return;
    flight.progress = progress;
    this.renderer.domElement.dataset.flightProgress = progress.toFixed(3);
    const rect = flight.source,
      target = flight.target;
    const clipX = rect.x * (1 - progress),
      clipTop = rect.y * (1 - progress);
    const clipWidth = rect.width + (innerWidth - rect.width) * progress;
    const clipHeight = rect.height + (innerHeight - rect.height) * progress;
    this.renderer.setScissorTest(true);
    this.renderer.setScissor(
      clipX,
      innerHeight - clipTop - clipHeight,
      clipWidth,
      clipHeight,
    );
    const view = new THREE.Vector4(
      rect.x / innerWidth,
      1 - rect.bottom / innerHeight,
      rect.width / innerWidth,
      rect.height / innerHeight,
    );
    const destination = new THREE.Vector4(
      target.x / innerWidth,
      1 - target.bottom / innerHeight,
      target.width / innerWidth,
      target.height / innerHeight,
    );
    this.panels.forEach((mesh) => {
      const u = mesh.material.uniforms;
      u.uView.value.copy(view);
      u.uTarget.value.copy(destination);
      u.uFlight.value = progress;
    });
    // One projection for the whole morph avoids a camera recoil near arrival.
    this.camera.position.z = frontZ + this.baseDistance;
    this.camera.lookAt(0, this.cameraTargetY, 0);
    Object.assign(flight.background.style, {
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      opacity: String(1 - THREE.MathUtils.smoothstep(progress, 0, 0.4)),
    });
    this.draw(performance.now());
  }
}

let instance: GalleryScene | null = null;
export function getGalleryScene() {
  return (instance ??= new GalleryScene());
}
export function existingGalleryScene() {
  return instance;
}
