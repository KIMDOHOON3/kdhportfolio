// Procedural polar light field on an original beveled cursor mesh.
export const storyVertexShader = `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const storyFragmentShader = `
  uniform vec2 uResolution;
  uniform vec3 uAccent;
  uniform float uReveal;
  uniform float uTravel;
  uniform vec2 uLight;
  varying vec3 vNormal;
  varying vec3 vView;
  const float TAU = 6.28318530718;
  float hash(float value) { return fract(sin(value * 127.1 + 311.7) * 43758.5453); }
  void main() {
    vec2 p = (gl_FragCoord.xy - uResolution * .5) / uResolution.y;
    float radius = length(p);
    float angular = (atan(p.y, p.x) / TAU + .5) * 220.0;
    float ray = floor(angular);
    float cell = abs(fract(angular) - .5);
    float aa = max(fwidth(angular) * 1.2, .004);
    float edge = 1.0 - smoothstep(.12 - aa, .12 + aa, cell);
    float core = 1.0 - smoothstep(.018, .055 + aa * .4, cell);
    float seed = hash(ray);
    float travel = smoothstep(0.0, 1.0, uTravel);
    float keep = step(seed, mix(.2, 1.0, travel));
    float speed = mix(.7, 3.6, travel);
    float phase = fract(radius * mix(1.8, 4.6, hash(ray + 23.0)) - uTravel * speed + seed);
    float tail = 1.0 - smoothstep(.24, .74, phase);
    float center = smoothstep(.018, .15, radius);
    float radialLight = pow(smoothstep(.025, .8, radius), .65);
    float hueSeed = hash(ray + 19.7);
    vec3 hue = mix(vec3(.0, .9, 1.0), vec3(.08, .12, 1.0), hueSeed);
    hue = mix(hue, vec3(.45, .015, 1.0), smoothstep(.82, 1.0, hueSeed));
    vec3 light = hue * (.7 + radialLight * .9) + vec3(core * .10);
    vec3 rays = light * edge * tail * keep * center;
    float dark = smoothstep(0.0, .88, uReveal);
    vec3 color = uAccent * (1.0 - dark) + rays * smoothstep(.2, .75, uReveal);
    vec3 n = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
    vec3 v = normalize(vView);
    vec3 l = normalize(vec3(uLight, 1.6));
    float spec = pow(max(dot(n, normalize(l + v)), 0.0), 85.0);
    float diffuse = max(dot(n, l), 0.0);
    float rim = pow(1.0 - abs(dot(n, v)), 4.0);
    color += (1.0 - dark) * (vec3(.08, .2, .35) * diffuse + vec3(spec * 1.15 + rim * .32));
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;
