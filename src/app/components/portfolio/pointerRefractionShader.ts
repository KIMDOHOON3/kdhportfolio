// Cursor flow belongs behind the solid glass, before the lettering is rendered.
// Warping the completed scene stretched the silhouette like soft jelly.
export const backdropRefractionShader = `
  uniform sampler2D uFlow;
  uniform vec2 uFlowTexel;
  uniform float uMotion;
  vec2 refractedBackdropUv(vec2 uv, vec2 flowUv) {
    vec3 flow = texture2D(uFlow, flowUv).xyz;
    vec2 gradient = vec2(
      texture2D(uFlow, flowUv + vec2(uFlowTexel.x, 0.0)).z - texture2D(uFlow, flowUv - vec2(uFlowTexel.x, 0.0)).z,
      texture2D(uFlow, flowUv + vec2(0.0, uFlowTexel.y)).z - texture2D(uFlow, flowUv - vec2(0.0, uFlowTexel.y)).z
    );
    vec2 displacement = clamp((flow.xy * 0.035 + gradient * 0.01) * uMotion, vec2(-0.016), vec2(0.016));
    return clamp(uv - displacement, 0.001, 0.999);
  }
`;

// Composite the solid geometry and its HDR glints without moving its pixels.
export const pointerRefractionShader = `
  uniform sampler2D uScene;
  uniform sampler2D uFlare;
  varying vec2 vUv;
  void main() {
    vec3 color = texture2D(uScene, vUv).rgb + texture2D(uFlare, vUv).rgb;
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;
