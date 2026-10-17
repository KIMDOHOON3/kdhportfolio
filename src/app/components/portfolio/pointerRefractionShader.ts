// A compact, decaying velocity trail approximates the reference's fluid display
// pass. The entire rendered scene is sampled, so glass edges and light bend
// together. This is independently authored, not a copy of its fluid solver.
export const pointerRefractionShader = `
  uniform sampler2D uScene;
  uniform vec2 uResolution;
  uniform vec4 uTrail[12];
  uniform float uStrength[12];
  varying vec2 vUv;
  void main() {
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 displacement = vec2(0.0);
    for (int i = 0; i < 12; i++) {
      vec2 delta = (vUv - uTrail[i].xy) * aspect;
      float influence = exp(-dot(delta, delta) / 0.018) * uStrength[i];
      vec2 velocity = uTrail[i].zw;
      displacement += (velocity + vec2(-delta.y, delta.x) * length(velocity) * 2.0) * influence * 0.32;
    }
    displacement = clamp(displacement, vec2(-0.055), vec2(0.055));
    float energy = smoothstep(0.002, 0.035, length(displacement));
    vec2 uv = clamp(vUv - displacement, 0.001, 0.999);
    vec2 dispersion = displacement * 0.075;
    vec3 color = vec3(
      texture2D(uScene, clamp(uv + dispersion, 0.001, 0.999)).r,
      texture2D(uScene, uv).g,
      texture2D(uScene, clamp(uv - dispersion, 0.001, 0.999)).b
    );
    color += vec3(0.025, 0.012, 0.045) * energy;
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;
