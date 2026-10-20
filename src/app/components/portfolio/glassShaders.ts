// Project-authored screen-space glass using measured back-surface depth,
// Snell refraction, Beer-Lambert absorption and Fresnel reflection.
export const glassVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vLocalHeight;
  varying float vStroke;
  attribute float aStrokeProgress;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vLocalHeight = position.y;
    vStroke = aStrokeProgress;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// Data pass: nearest back surface, outward view-space normal and linear depth.
// No display encoding or lighting may be applied to these values.
export const glassBackVertexShader = `
  uniform float uDepthOrigin;
  varying vec3 vBackNormal;
  varying float vBackDepth;
  attribute float aStrokeProgress;
  varying float vBackStroke;
  void main() {
    vec4 positionView = modelViewMatrix * vec4(position, 1.0);
    vBackNormal = normalize(normalMatrix * normal);
    // Store depth near zero. Absolute camera depth in half floats creates
    // visible contour bands, especially with distant portrait framing.
    vBackDepth = -positionView.z - uDepthOrigin;
    vBackStroke = aStrokeProgress;
    gl_Position = projectionMatrix * positionView;
  }
`;

export const glassBackFragmentShader = `
  varying vec3 vBackNormal;
  varying float vBackDepth;
  varying float vBackStroke;
  uniform float uStrokeReveal;
  void main() {
    if (uStrokeReveal < 1.0 && vBackStroke > uStrokeReveal) discard;
    gl_FragColor = vec4(normalize(vBackNormal) * 0.5 + 0.5, vBackDepth);
  }
`;

export const glassFragmentShader = `
  uniform sampler2D uScene;
  uniform sampler2D uBackSurface;
  uniform mat4 uProjection;
  uniform float uDepthOrigin;
  uniform samplerCube uStudio;
  uniform vec2 uResolution;
  uniform vec3 uLight;
  uniform vec3 uTintTop;
  uniform vec3 uTintBottom;
  uniform vec2 uTintRange;
  uniform vec2 uPointer;
  uniform sampler2D uFlow;
  uniform float uMotion;
  uniform float uReveal;
  uniform float uStrokeReveal;
  varying vec3 vWorldPosition;
  uniform float uClearRim;
  varying vec3 vNormal;
  varying float vLocalHeight;
  varying float vStroke;

  vec2 projectUv(vec3 point) {
    vec4 clip = uProjection * vec4(point, 1.0);
    return clip.xy / clip.w * 0.5 + 0.5;
  }

  // Trace entry -> measured back surface -> backdrop, rather than using a
  // single normal offset. Keep each channel sharp, including the blue volume.
  vec2 transmissionUv(vec3 positionView, vec3 incident, vec3 normalView,
                      float ior, out float distanceInside) {
    vec3 inside = refract(incident, normalView, 1.0 / ior);
    vec2 startUv = projectUv(positionView);
    vec4 back = texture2D(uBackSurface, startUv);
    float thickness = max(0.0, back.a + uDepthOrigin + positionView.z);
    vec3 exitPoint = positionView + inside * thickness / max(0.15, -inside.z);
    vec2 exitUv = projectUv(exitPoint);
    vec4 candidate = texture2D(uBackSurface, clamp(exitUv, 0.001, 0.999));
    // At a silhouette the bent ray can miss the measured back surface. Reject
    // empty/distant samples and fall back to the same-pixel rear surface.
    if (dot(candidate.rgb, candidate.rgb) > 0.1 &&
        candidate.a + uDepthOrigin > -positionView.z && abs(candidate.a - back.a) < 2.5) {
      back = candidate;
      thickness = max(0.0, back.a + uDepthOrigin + positionView.z);
      exitPoint = positionView + inside * thickness / max(0.15, -inside.z);
      exitUv = projectUv(exitPoint);
    }
    distanceInside = length(exitPoint - positionView);
    vec3 backNormal = normalize(back.rgb * 2.0 - 1.0);
    vec3 outgoing = refract(inside, -backNormal, ior);
    // Retain the entry ray at unresolved grazing/TIR pixels. The
    // Fresnel reflection takes over there instead of a black texture border.
    if (dot(outgoing, outgoing) < 0.01) outgoing = inside;
    float backdropDepth = -(viewMatrix * vec4(0.0, 0.0, -5.0, 1.0)).z;
    float travel = max(0.0, backdropDepth + exitPoint.z) / max(0.15, -outgoing.z);
    vec2 result = projectUv(exitPoint + outgoing * travel);
    return clamp(mix(startUv, result, smoothstep(0.0, 0.10, thickness)), 0.001, 0.999);
  }

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
    if (uStrokeReveal < 1.0 && vStroke > uStrokeReveal) discard;
    vec2 screenUv = gl_FragCoord.xy / uResolution;
    vec2 flow = texture2D(uFlow, screenUv).xy * uMotion;
    vec3 normal = normalize(vNormal + vec3(flow * 0.06, 0.0));
    vec3 view = normalize(cameraPosition - vWorldPosition);
    float facing = clamp(dot(normal, view), 0.0, 1.0);
    vec3 positionView = (viewMatrix * vec4(vWorldPosition, 1.0)).xyz;
    vec3 normalView = normalize(mat3(viewMatrix) * normal);
    vec3 incident = normalize(positionView);
    float redDistance, greenDistance, blueDistance;
    // A mild effective IOR fits the shallow, stylized lettering;
    // strong solid-glass bending compresses every background band into white ribs.
    vec2 red = transmissionUv(positionView, incident, normalView, 1.175, redDistance);
    vec2 green = transmissionUv(positionView, incident, normalView, 1.180, greenDistance);
    vec2 blue = transmissionUv(positionView, incident, normalView, 1.190, blueDistance);
    vec3 transmitted = vec3(
      texture2D(uScene, red).r,
      texture2D(uScene, green).g,
      texture2D(uScene, blue).b
    );
    float height = (vLocalHeight-uTintRange.x)/max(0.001,uTintRange.y-uTintRange.x);
    float gradient = smoothstep(0.22,0.94,height);
    vec3 tint = mix(uTintBottom, uTintTop, gradient);
    // Beer-Lambert absorption colors the transmitted light, not an opaque coat.
    // Thin edges and the lower lettering stay clear; long paths carry the blue.
    vec3 absorption = -log(max(tint, vec3(0.025))) * (0.045 + gradient * 0.42);
    vec3 attenuation = exp(-absorption * min(greenDistance, 2.5));
    vec3 color = transmitted * attenuation;

    vec3 light = normalize(uLight - vWorldPosition);
    vec3 halfway = normalize(light + view);
    float highlight = max(dot(normal, halfway), 0.0);
    float specular = pow(highlight, 820.0) * 2.8;
    float fresnel = 0.034 + 0.966 * pow(1.0 - facing, 5.0);
    // Narrow studio reflections leave the transmitted background readable.
    vec3 reflected = reflect(-view, normal);
    // Move the broad studio reflection with the pointer as well as the small
    // specular light. The cubemap itself still needs only one capture.
    vec2 angle = uPointer * vec2(1.2, -0.9) * uMotion;
    reflected.xz = mat2(cos(angle.x), -sin(angle.x), sin(angle.x), cos(angle.x)) * reflected.xz;
    reflected.yz = mat2(cos(angle.y), -sin(angle.y), sin(angle.y), cos(angle.y)) * reflected.yz;
    // A small reflection cone softens softbox edges, without blurring the
    // transmitted background or adding a white diffuse layer.
    vec3 tangent = normalize(cross(reflected, vec3(0.0, 1.0, 0.01)));
    vec3 bitangent = cross(reflected, tangent);
    vec3 studio = textureCube(uStudio, reflected).rgb * 0.4;
    studio += textureCube(uStudio, normalize(reflected + tangent * 0.025)).rgb * 0.15;
    studio += textureCube(uStudio, normalize(reflected - tangent * 0.025)).rgb * 0.15;
    studio += textureCube(uStudio, normalize(reflected + bitangent * 0.025)).rgb * 0.15;
    studio += textureCube(uStudio, normalize(reflected - bitangent * 0.025)).rgb * 0.15;
    float strip = reflectedStrip(reflected, vec3(-0.32, 0.50, 0.82), vec3(-0.14, 1.0, 0.0), 0.035, 0.85);
    float stripShoulder = reflectedStrip(reflected, vec3(-0.32, 0.50, 0.82), vec3(-0.14, 1.0, 0.0), 0.095, 1.0);
    float fillStrip = reflectedStrip(reflected, vec3(0.72, -0.22, 0.65), vec3(0.22, 1.0, 0.0), 0.025, 0.7);
    vec3 reflectedLight = studio * 0.55;
    reflectedLight += vec3(1.0, 0.98, 0.93) * (strip * 3.5 + stripShoulder * 0.25);
    reflectedLight += vec3(0.68, 0.84, 1.0) * fillStrip * 0.8;
    // Share energy between clear transmission and view-dependent reflection.
    // Avoid stacking opaque white shoulders over every curved face.
    color = color * (1.0 - fresnel) + reflectedLight * fresnel;
    color += vec3(1.0, 0.98, 0.93) * specular;
    // At grazing angles the dark studio reflection looks like a black outline.
    // Let the glass silhouette transmit the backdrop instead of a painted rim.
    if (uClearRim > 0.0) {
      float clearEdge = 1.0 - smoothstep(0.08, 0.35, facing);
      color = mix(color, texture2D(uScene, screenUv).rgb, clearEdge * uClearRim);
    }
    float surfaceReveal = uReveal;
    if (uStrokeReveal < 1.0) {
      // V follows the asset's original tube path, including the loops that
      // travel back to the left. A short luminous front leaves solid glass.
      float behind = max(0.0, uStrokeReveal - vStroke);
      float tip = (1.0 - smoothstep(0.0, 0.025, behind))
                * (1.0 - smoothstep(0.965, 1.0, uStrokeReveal));
      color += vec3(0.65, 1.9, 3.6) * tip * 1.15;
      surfaceReveal *= smoothstep(0.0, 0.006, behind);
    }
    // Both uniform branches are skipped once the one-time drawing completes.
    if (surfaceReveal < 1.0) color = mix(texture2D(uScene, screenUv).rgb, color, surfaceReveal);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;
