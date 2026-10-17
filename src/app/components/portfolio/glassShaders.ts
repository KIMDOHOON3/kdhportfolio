// Original compact shader, informed by the public reference's screen-space
// refraction approach. This is not the reference site's shader or model.
export const glassVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vHeight;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vHeight = world.y;
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
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vHeight;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 view = normalize(cameraPosition - vWorldPosition);
    float facing = clamp(dot(normal, view), 0.0, 1.0);
    vec2 uv = gl_FragCoord.xy / uResolution;
    // One sharp sample per channel: averaging different depths made the glass hazy.
    vec2 incident = -view.xy;
    vec2 red = refract(-view, normal, 1.0 / 1.45).xy - incident;
    vec2 green = refract(-view, normal, 1.0 / 1.47).xy - incident;
    vec2 blue = refract(-view, normal, 1.0 / 1.49).xy - incident;
    float depth = 0.32;
    vec3 transmitted = vec3(
      texture2D(uScene, clamp(uv + red * depth, 0.001, 0.999)).r,
      texture2D(uScene, clamp(uv + green * depth, 0.001, 0.999)).g,
      texture2D(uScene, clamp(uv + blue * depth, 0.001, 0.999)).b
    );
    float gradient = smoothstep(-1.6, 3.1, vHeight);
    vec3 tint = mix(uTintBottom, uTintTop, gradient);
    // A clear face still needs blue absorption and an environment reflection
    // to describe the inflated volume instead of disappearing into the backdrop.
    float edge = pow(1.0 - facing, 2.0);
    vec3 color = transmitted * mix(vec3(1.0), tint, 0.08 + gradient * 0.24 + edge * 0.12);

    vec3 light = normalize(uLight - vWorldPosition);
    vec3 halfway = normalize(light + view);
    float specular = pow(max(dot(normal, halfway), 0.0), 180.0);
    float fresnel = 0.055 + 0.945 * pow(1.0 - facing, 4.0);
    color *= 1.0 - edge * 0.035;
    float side = smoothstep(-0.5, 0.7, dot(normal, normalize(vec3(-1.0, 1.0, 1.0))));
    // Narrow studio reflections leave the transmitted background readable.
    vec3 reflected = reflect(-view, normal);
    vec3 studio = textureCube(uStudio, reflected).rgb;
    color = mix(color, studio, fresnel * 0.78);
    float strip = pow(max(dot(reflected, normalize(vec3(-0.35, 0.8, 0.5))), 0.0), 240.0);
    float rim = pow(max(dot(reflected, normalize(vec3(0.75, 0.25, 0.6))), 0.0), 300.0);
    float ceiling = pow(max(dot(reflected, normalize(vec3(0.1, 0.97, -0.2))), 0.0), 150.0);
    color += vec3(1.0, 0.99, 0.96) * (specular * 1.8 + strip * 0.75 + ceiling * 0.5);
    color += vec3(0.75, 0.88, 1.0) * (rim * 0.85 + fresnel * side * 0.25);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;
