// Original compact shader, informed by the public reference's screen-space
// refraction approach. This is not the reference site's shader or model.
export const glassVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vLocalHeight;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vLocalHeight = position.y;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const glassFragmentShader = `
  uniform sampler2D uScene;
  uniform samplerCube uStudio;
  uniform vec2 uResolution;
  uniform vec3 uLight;
  uniform vec3 uTintTop;
  uniform vec3 uTintBottom;
  uniform vec2 uTintRange;
  uniform vec2 uPointer;
  uniform sampler2D uFlow;
  uniform float uMotion;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vLocalHeight;

  // A long studio strip reflected by the actual surface normal forms a curved
  // highlight along the inflated lettering, without painting a screen outline.
  float reflectedStrip(vec3 direction, vec3 aim, vec3 longAxis, float width, float halfLength) {
    aim = normalize(aim);
    vec3 across = normalize(cross(longAxis, aim));
    vec3 along = cross(aim, across);
    float forward = dot(direction, aim);
    vec2 panelUv = vec2(dot(direction, across), dot(direction, along)) / max(forward, 0.01);
    float footprint = fwidth(panelUv.x);
    float sigma = sqrt(width * width + footprint * footprint * 0.35);
    float core = exp(-0.5 * pow(panelUv.x / sigma, 2.0));
    float ends = 1.0 - smoothstep(halfLength * 0.7, halfLength, abs(panelUv.y));
    // Conserve the strip's energy when filtering subpixel reflections. Keeping
    // the full peak after widening the footprint turns mobile curves white.
    return core * (width / sigma) * ends * smoothstep(0.05, 0.25, forward);
  }

  void main() {
    vec2 screenUv = gl_FragCoord.xy / uResolution;
    vec2 flow = texture2D(uFlow, screenUv).xy * uMotion;
    vec3 normal = normalize(vNormal + vec3(flow * 0.18, 0.0));
    vec3 view = normalize(cameraPosition - vWorldPosition);
    float facing = clamp(dot(normal, view), 0.0, 1.0);
    vec2 uv = gl_FragCoord.xy / uResolution;
    // One sharp sample per channel: averaging different depths made the glass hazy.
    vec2 incident = -view.xy;
    vec2 red = refract(-view, normal, 1.0 / 1.15).xy - incident;
    vec2 green = refract(-view, normal, 1.0 / 1.16).xy - incident;
    vec2 blue = refract(-view, normal, 1.0 / 1.18).xy - incident;
    float depth = 0.28;
    vec3 transmitted = vec3(
      texture2D(uScene, clamp(uv + red * depth, 0.001, 0.999)).r,
      texture2D(uScene, clamp(uv + green * depth, 0.001, 0.999)).g,
      texture2D(uScene, clamp(uv + blue * depth, 0.001, 0.999)).b
    );
    float height = (vLocalHeight-uTintRange.x)/max(0.001,uTintRange.y-uTintRange.x);
    float gradient = smoothstep(0.22,0.94,height);
    vec3 tint = mix(uTintBottom, uTintTop, gradient);
    // A clear face still needs blue absorption and an environment reflection
    // to describe the inflated volume instead of disappearing into the backdrop.
    float edge = pow(1.0 - facing, 2.0);
    vec3 color = transmitted * mix(vec3(1.0), tint, 0.18 + gradient * 0.55 + edge * 0.04);

    vec3 light = normalize(uLight - vWorldPosition);
    vec3 halfway = normalize(light + view);
    float highlight = max(dot(normal, halfway), 0.0);
    float specular = pow(highlight, 220.0) * 0.25 + pow(highlight, 650.0) * 2.7;
    specular *= 1.0 - gradient * 0.55;
    float fresnel = 0.04 + 0.96 * pow(1.0 - facing, 5.0);
    color *= 1.0 - edge * 0.035;
    float side = smoothstep(-0.5, 0.7, dot(normal, normalize(vec3(-1.0, 1.0, 1.0))));
    // Narrow studio reflections leave the transmitted background readable.
    vec3 reflected = reflect(-view, normal);
    // Move the broad studio reflection with the pointer as well as the small
    // specular light. The cubemap itself still needs only one capture.
    vec2 angle = uPointer * vec2(0.9, -0.7) * uMotion;
    reflected.xz = mat2(cos(angle.x), -sin(angle.x), sin(angle.x), cos(angle.x)) * reflected.xz;
    reflected.yz = mat2(cos(angle.y), -sin(angle.y), sin(angle.y), cos(angle.y)) * reflected.yz;
    vec3 studio = textureCube(uStudio, reflected).rgb;
    // Preserve the shape of bright softboxes instead of clipping their entire
    // reflection to white. A separate sharp glint retains HDR glare.
    studio = studio / (vec3(1.0) + studio * 0.55);
    color = mix(color, studio, 0.015 + fresnel * 0.22);
    float strip = reflectedStrip(reflected, vec3(-0.32, 0.50, 0.82), vec3(-0.14, 1.0, 0.0), 0.055, 0.95);
    float stripShoulder = reflectedStrip(reflected, vec3(-0.32, 0.50, 0.82), vec3(-0.14, 1.0, 0.0), 0.15, 1.15);
    float fillStrip = reflectedStrip(reflected, vec3(0.72, -0.22, 0.65), vec3(0.22, 1.0, 0.0), 0.03, 0.9);
    float rim = pow(max(dot(reflected, normalize(vec3(0.75, 0.25, 0.6))), 0.0), 160.0);
    color += vec3(1.0, 0.98, 0.93) * (specular + strip * 0.60 + stripShoulder * 0.16);
    color += vec3(0.68, 0.84, 1.0) * (fillStrip * 0.12 + rim * 0.18 + fresnel * side * 0.08);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;
