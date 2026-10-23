import type { Texture, WebGLRenderer, WebGLRenderTarget } from "three";

// Pressure projection gives a cursor impulse a rolling wake rather than simply
// translating a soft brush.
export function createFluidProjection(
  THREE: typeof import("three"),
  renderer: WebGLRenderer,
) {
  const vertexShader = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`;
  const prefix = `
    varying vec2 vUv;
    uniform sampler2D uVelocity, uPressure, uDivergence, uCurl;
    uniform vec2 uTexel;
    uniform float uDt;
  `;
  const make = (body: string) =>
    new THREE.ShaderMaterial({
      toneMapped: false,
      depthTest: false,
      depthWrite: false,
      vertexShader,
      fragmentShader: prefix + body,
      uniforms: {
        uVelocity: { value: null },
        uPressure: { value: null },
        uDivergence: { value: null },
        uCurl: { value: null },
        uTexel: { value: new THREE.Vector2(1 / 128, 1 / 128) },
        uDt: { value: 1 / 60 },
      },
    });
  const curl = make(`void main(){
    float l=texture2D(uVelocity,vUv-vec2(uTexel.x,0.0)).y;
    float r=texture2D(uVelocity,vUv+vec2(uTexel.x,0.0)).y;
    float b=texture2D(uVelocity,vUv-vec2(0.0,uTexel.y)).x;
    float t=texture2D(uVelocity,vUv+vec2(0.0,uTexel.y)).x;
    gl_FragColor=vec4((r-l-t+b)*0.5,0.0,0.0,1.0);
  }`);
  const swirl = make(`void main(){
    float l=abs(texture2D(uCurl,vUv-vec2(uTexel.x,0.0)).x);
    float r=abs(texture2D(uCurl,vUv+vec2(uTexel.x,0.0)).x);
    float b=abs(texture2D(uCurl,vUv-vec2(0.0,uTexel.y)).x);
    float t=abs(texture2D(uCurl,vUv+vec2(0.0,uTexel.y)).x);
    vec2 gradient=vec2(r-l,t-b);
    gradient/=length(gradient)+0.00001;
    float spin=texture2D(uCurl,vUv).x;
    vec3 v=texture2D(uVelocity,vUv).xyz;
    v.xy+=vec2(gradient.y,-gradient.x)*spin*min(uDt,0.033)*4.0;
    gl_FragColor=vec4(clamp(v.xy,-0.85,0.85),v.z,1.0);
  }`);
  const divergence = make(`void main(){
    float l=texture2D(uVelocity,vUv-vec2(uTexel.x,0.0)).x;
    float r=texture2D(uVelocity,vUv+vec2(uTexel.x,0.0)).x;
    float b=texture2D(uVelocity,vUv-vec2(0.0,uTexel.y)).y;
    float t=texture2D(uVelocity,vUv+vec2(0.0,uTexel.y)).y;
    gl_FragColor=vec4((r-l+t-b)*0.5,0.0,0.0,1.0);
  }`);
  const pressure = make(`void main(){
    float l=texture2D(uPressure,vUv-vec2(uTexel.x,0.0)).x;
    float r=texture2D(uPressure,vUv+vec2(uTexel.x,0.0)).x;
    float b=texture2D(uPressure,vUv-vec2(0.0,uTexel.y)).x;
    float t=texture2D(uPressure,vUv+vec2(0.0,uTexel.y)).x;
    float d=texture2D(uDivergence,vUv).x;
    gl_FragColor=vec4((l+r+b+t-d)*0.25,0.0,0.0,1.0);
  }`);
  const project = make(`void main(){
    float l=texture2D(uPressure,vUv-vec2(uTexel.x,0.0)).x;
    float r=texture2D(uPressure,vUv+vec2(uTexel.x,0.0)).x;
    float b=texture2D(uPressure,vUv-vec2(0.0,uTexel.y)).x;
    float t=texture2D(uPressure,vUv+vec2(0.0,uTexel.y)).x;
    vec3 v=texture2D(uVelocity,vUv).xyz;
    gl_FragColor=vec4(v.xy-vec2(r-l,t-b)*0.5,v.z,1.0);
  }`);
  const materials = [curl, swirl, divergence, pressure, project];
  const targets = Array.from(
    { length: 5 },
    () =>
      new THREE.WebGLRenderTarget(128, 128, {
        type: THREE.HalfFloatType,
        depthBuffer: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
      }),
  );
  const [curlTarget, swirlTarget, divTarget, p0, p1] = targets;
  const savedClear = new THREE.Color();
  const scene = new THREE.Scene(),
    camera = new THREE.Camera();
  const geometry = new THREE.PlaneGeometry(2, 2);
  const quad = new THREE.Mesh(geometry, curl);
  scene.add(quad);
  const run = (material: typeof curl, target: WebGLRenderTarget) => {
    quad.material = material;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
  };
  return {
    prepare() {
      // Link the pressure shaders while idle, not on the first pointer impulse.
      return Promise.all(
        materials.map((material) => {
          const preview = new THREE.Scene();
          preview.add(new THREE.Mesh(geometry, material));
          return renderer.compileAsync(preview, camera);
        }),
      );
    },
    resize(width: number, height: number) {
      for (const target of targets) target.setSize(width, height);
      for (const material of materials)
        material.uniforms.uTexel.value.set(1 / width, 1 / height);
    },
    project(input: Texture, output: WebGLRenderTarget, dt: number) {
      curl.uniforms.uVelocity.value = input;
      run(curl, curlTarget);
      swirl.uniforms.uVelocity.value = input;
      swirl.uniforms.uCurl.value = curlTarget.texture;
      swirl.uniforms.uDt.value = dt;
      run(swirl, swirlTarget);
      divergence.uniforms.uVelocity.value = swirlTarget.texture;
      run(divergence, divTarget);
      renderer.setRenderTarget(p0);
      renderer.getClearColor(savedClear);
      const clearAlpha = renderer.getClearAlpha();
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.setClearColor(savedClear, clearAlpha);
      let read = p0,
        write = p1;
      pressure.uniforms.uDivergence.value = divTarget.texture;
      for (let i = 0; i < 5; i++) {
        pressure.uniforms.uPressure.value = read.texture;
        run(pressure, write);
        [read, write] = [write, read];
      }
      project.uniforms.uVelocity.value = swirlTarget.texture;
      project.uniforms.uPressure.value = read.texture;
      run(project, output);
    },
    dispose() {
      targets.forEach((t) => t.dispose());
      materials.forEach((m) => m.dispose());
      geometry.dispose();
    },
  };
}
