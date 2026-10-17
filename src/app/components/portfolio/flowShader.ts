// Persistent, advected cursor velocity. This is a small flow map, not a claim
// to reproduce the reference's private fluid simulation.
export const flowFragmentShader = `
  uniform sampler2D uPrevious;
  uniform vec2 uTexel;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform float uAspect;
  uniform float uImpulse;
  uniform float uDt;
  varying vec2 vUv;
  void main() {
    vec3 current = texture2D(uPrevious, vUv).xyz;
    vec2 back = clamp(vUv - current.xy * uDt * 1.2, 0.001, 0.999);
    vec3 advected = texture2D(uPrevious, back).xyz;
    vec3 neighbours = (
      texture2D(uPrevious, back + vec2(uTexel.x, 0.0)).xyz +
      texture2D(uPrevious, back - vec2(uTexel.x, 0.0)).xyz +
      texture2D(uPrevious, back + vec2(0.0, uTexel.y)).xyz +
      texture2D(uPrevious, back - vec2(0.0, uTexel.y)).xyz
    ) * 0.25;
    vec3 field = mix(advected, neighbours, min(0.35, uDt * 8.0)) * exp(-uDt * 4.0);
    vec2 delta = (vUv - uPointer) * vec2(uAspect, 1.0);
    float brush = exp(-dot(delta, delta) / 0.0023) * uImpulse;
    vec2 swirl = vec2(-delta.y, delta.x) * length(uVelocity) * 2.5;
    field.xy = mix(field.xy, uVelocity + swirl, brush * (1.0 - exp(-uDt * 90.0)));
    field.z = max(field.z, brush);
    gl_FragColor = vec4(clamp(field.xy, -0.85, 0.85), field.z, 1.0);
  }
`;
