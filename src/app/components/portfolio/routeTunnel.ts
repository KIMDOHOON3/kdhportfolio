const vertex = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = position * .5 + .5;
  gl_Position = vec4(position, 0., 1.);
}`;

// One full-screen draw, no models, textures, post-processing or scene graph.
// The ray starts inside a curved tube; its wall distance drives sphere tracing.
const fragment = `
precision highp float;
varying vec2 uv;
uniform vec2 resolution;
uniform float progress;
uniform float direction;

vec2 center(float z, vec2 bend) {
  return bend * z * z * vec2(.012, .008);
}
float wall(vec3 p, vec2 bend) {
  return 1.65 - length(p.xy - center(p.z, bend));
}
void main() {
  float travel = mix(progress, 1. - progress, step(direction, 0.));
  vec2 bend = vec2(.8 + .36 * sin(travel * 2.8), -.58 + .26 * cos(travel * 3.));
  vec2 screen = (uv * 2. - 1.) * vec2(resolution.x / resolution.y, 1.);
  // The camera follows the bend. The vanishing point moves while near walls
  // rush past the screen; this is depth motion rather than scaling flat rings.
  screen -= vec2(.06 * sin(travel * 2.6), .04 * cos(travel * 2.2));
  float fov = 1.05 + .3 * sin(progress * 3.14159265);
  vec3 ray = normalize(vec3(screen * fov + vec2(.32, -.10), 1.8));
  float distance = .02;
  vec3 p = vec3(0.);
  for (int i = 0; i < 28; i++) {
    p = ray * distance;
    float gap = wall(p, bend);
    if (gap < .009) break;
    distance += max(gap * .72, .018);
    if (distance > 24.) break;
  }
  vec3 color;
  {
    vec2 q = p.xy - center(p.z, bend);
    float angle = atan(q.y, q.x);
    vec3 normal = normalize(vec3(-q, dot(q, bend * p.z * vec2(.024, .016))));
    float front = pow(max(0., dot(normal, normalize(vec3(-.5, .7, -.4)))), 2.);
    float soft = .5 + .5 * sin(angle + .6);
    color = mix(vec3(.035, .16, .39), vec3(.19, .47, .85), soft);
    color = mix(color, vec3(.6, .81, 1.), front * .65);
    // Broad reflected ribbons make the surface read as blue glass.
    float reflection = pow(.5 + .5 * cos(angle * 3. + .28 * p.z), 20.);
    float second = pow(.5 + .5 * cos(angle * 2. - .17 * p.z + 1.6), 36.);
    color = mix(color, vec3(.9, .96, 1.), reflection * .78);
    color += vec3(.34, .53, .8) * second * .28;
    // Bands are fixed in world space and pass the camera as it accelerates.
    float worldZ = p.z + travel * 17.;
    float band = pow(.5 + .5 * cos(worldZ * 3.1), 56.);
    color += vec3(.36, .56, .78) * band * .28;
    float depth = smoothstep(3., 19., distance);
    color = mix(color, vec3(.78, .9, 1.), depth * .9);
    color = mix(color, vec3(.84, .94, 1.), smoothstep(17., 24., distance));
  }
  float glow = pow(max(0., ray.z), 18.) * .14;
  color += vec3(.12, .17, .2) * glow;
  float exit = smoothstep(.68, 1., progress);
  float radius = pow(exit, 1.3) * (length(vec2(resolution.x / resolution.y, 1.)) + .2);
  float aperture = smoothstep(radius - .035, radius + .035, length(screen));
  float alpha = mix(1., aperture, smoothstep(.68, .72, progress));
  gl_FragColor = vec4(clamp(color, 0., 1.), alpha);
}`;

/** Allocate lazily, render only during navigation, release the backing size idle. */
export function createRouteTunnel(canvas: HTMLCanvasElement) {
  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let uniforms: {
    progress: WebGLUniformLocation | null;
    direction: WebGLUniformLocation | null;
  } | null = null;
  let frame = 0;
  let value = 0;
  let back = false;
  let disabled = false;
  const shaders: WebGLShader[] = [];
  const initialize = () => {
    if (disabled) return false;
    if (gl && program) return true;
    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "low-power",
        preserveDrawingBuffer: false,
      });
      if (!gl) return false;
      const context = gl;
      const compile = (type: number, source: string) => {
        const shader = context.createShader(type);
        if (!shader) throw new Error("Transition shader unavailable");
        shaders.push(shader);
        context.shaderSource(shader, source);
        context.compileShader(shader);
        if (!context.getShaderParameter(shader, context.COMPILE_STATUS))
          throw new Error("Transition shader compilation failed");
        return shader;
      };
      program = context.createProgram();
      if (!program) return false;
      context.attachShader(program, compile(context.VERTEX_SHADER, vertex));
      context.attachShader(program, compile(context.FRAGMENT_SHADER, fragment));
      context.linkProgram(program);
      if (!context.getProgramParameter(program, context.LINK_STATUS))
        throw new Error("Transition program unavailable");
      context.useProgram(program);
      buffer = context.createBuffer();
      context.bindBuffer(context.ARRAY_BUFFER, buffer);
      context.bufferData(
        context.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        context.STATIC_DRAW,
      );
      const attribute = context.getAttribLocation(program, "position");
      context.enableVertexAttribArray(attribute);
      context.vertexAttribPointer(attribute, 2, context.FLOAT, false, 0, 0);
      uniforms = {
        progress: context.getUniformLocation(program, "progress"),
        direction: context.getUniformLocation(program, "direction"),
      };
      return true;
    } catch {
      disabled = true;
      canvas.dataset.ready = "false";
      return false;
    }
  };
  const draw = () => {
    if (!gl || !program || !uniforms || gl.isContextLost()) return;
    gl.uniform1f(uniforms.progress, value);
    gl.uniform1f(uniforms.direction, back ? -1 : 1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
  const move = (end: number, duration: number) => {
    cancelAnimationFrame(frame);
    const start = value;
    const began = performance.now();
    const tick = (time: number) => {
      const t = Math.min(1, (time - began) / duration);
      // Accelerate through the bend, then decelerate on arrival.
      const eased = end < 1 ? t * t : 1 - Math.pow(1 - t, 2);
      value = start + (end - start) * eased;
      draw();
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  };
  const lost = (event: Event) => {
    event.preventDefault();
    disabled = true;
    cancelAnimationFrame(frame);
    canvas.dataset.ready = "false";
  };
  canvas.addEventListener("webglcontextlost", lost);
  return {
    start(reverse: boolean) {
      cancelAnimationFrame(frame);
      if (!initialize() || !gl || !program) return;
      // No high-DPI full-screen buffers on mobile. CSS scales this short-lived
      // surface; the persistent portfolio renderer is left untouched.
      const scale = Math.min(1, 560 / innerWidth, 1000 / innerHeight);
      canvas.width = Math.round(innerWidth * scale);
      canvas.height = Math.round(innerHeight * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(
        gl.getUniformLocation(program, "resolution"),
        canvas.width,
        canvas.height,
      );
      value = 0;
      back = reverse;
      canvas.dataset.ready = "true";
      draw();
      move(0.68, 620);
    },
    arrive() {
      if (disabled || !gl) return;
      move(1, 520);
    },
    stop() {
      cancelAnimationFrame(frame);
      canvas.width = canvas.height = 1;
    },
    destroy() {
      cancelAnimationFrame(frame);
      canvas.removeEventListener("webglcontextlost", lost);
      if (gl) {
        shaders.forEach((shader) => gl?.deleteShader(shader));
        gl.deleteProgram(program);
        gl.deleteBuffer(buffer);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
    },
  };
}
