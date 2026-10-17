// Refract the complete scene through the persistent cursor flow map. HDR-only
// glare adds bright streaks to glass highlights without whitening the sky.
export const pointerRefractionShader = `
  uniform sampler2D uScene;
  uniform sampler2D uFlare;
  uniform vec2 uResolution;
  uniform sampler2D uFlow;
  uniform vec2 uFlowTexel;
  uniform float uMotion;
  varying vec2 vUv;
  void main() {
    vec3 flow = texture2D(uFlow, vUv).xyz;
    vec2 gradient = vec2(
      texture2D(uFlow, vUv + vec2(uFlowTexel.x, 0.0)).z - texture2D(uFlow, vUv - vec2(uFlowTexel.x, 0.0)).z,
      texture2D(uFlow, vUv + vec2(0.0, uFlowTexel.y)).z - texture2D(uFlow, vUv - vec2(0.0, uFlowTexel.y)).z
    );
    vec2 displacement = clamp((flow.xy * 0.105 + gradient * 0.025) * uMotion, vec2(-0.06), vec2(0.06));
    vec2 uv = clamp(vUv - displacement, 0.001, 0.999);
    vec2 dispersion = displacement * 0.06;
    vec3 color = vec3(
      texture2D(uScene, clamp(uv + dispersion, 0.001, 0.999)).r,
      texture2D(uScene, uv).g,
      texture2D(uScene, clamp(uv - dispersion, 0.001, 0.999)).b
    );
    float wake = smoothstep(0.018,0.08,length(displacement));
    vec3 spectral = 0.5+0.5*cos(vec3(0.0,2.1,4.2)+length(flow.xy)*9.0);
    color += spectral*wake*0.06*uMotion;
    color += texture2D(uFlare,uv).rgb;
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;
