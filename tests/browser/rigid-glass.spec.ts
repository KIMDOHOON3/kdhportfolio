import { expect, test } from "@playwright/test";
import { pointerRefractionShader } from "../../src/app/components/portfolio/pointerRefractionShader";

test("final glass composite preserves hard silhouettes under cursor flow", async ({
  page,
}) => {
  // Exercise the real final-pass shader with a hard-edged scene and two flow
  // textures. The former full-scene refraction shifts these edges and fails.
  await page.goto("/");
  const result = await page.evaluate((fragment) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    const gl = canvas.getContext("webgl")!;
    if (!gl) throw new Error("WebGL required for composite regression");
    const compile = (kind: number, source: string) => {
      const shader = gl.createShader(kind)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(shader)!);
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(
      program,
      compile(
        gl.VERTEX_SHADER,
        "attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}",
      ),
    );
    // Color encoding is irrelevant to edge positions; omit Three's display
    // chunk in this small linear-color fixture, leaving all UV logic intact.
    gl.attachShader(
      program,
      compile(
        gl.FRAGMENT_SHADER,
        "precision highp float;\n" +
          fragment.replace("#include <colorspace_fragment>", ""),
      ),
    );
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program)!);
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const location = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    const pixels = new Uint8Array(32 * 32 * 4);
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 32; x++) {
        const i = (y * 32 + x) * 4,
          inside = x >= 8 && x < 24 && y >= 6 && y < 26;
        pixels.set(
          [inside ? 40 : 210, inside ? 100 : 220, inside ? 220 : 230, 255],
          i,
        );
      }
    const texture = (unit: number, bytes: Uint8Array) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        32,
        32,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        bytes,
      );
      return texture;
    };
    texture(0, pixels);
    texture(1, new Uint8Array(pixels.length));
    gl.uniform1i(gl.getUniformLocation(program, "uScene"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "uFlare"), 1);
    gl.uniform1i(gl.getUniformLocation(program, "uFlow"), 2);
    gl.uniform2f(gl.getUniformLocation(program, "uResolution"), 32, 32);
    gl.uniform2f(gl.getUniformLocation(program, "uFlowTexel"), 1 / 32, 1 / 32);
    gl.uniform1f(gl.getUniformLocation(program, "uMotion"), 1);
    const render = (active: boolean) => {
      const flow = new Uint8Array(pixels.length);
      if (active)
        for (let i = 0; i < flow.length; i += 4)
          flow.set([220, 120, 255, 255], i);
      texture(2, flow);
      gl.viewport(0, 0, 32, 32);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      const result = new Uint8Array(pixels.length);
      gl.readPixels(0, 0, 32, 32, gl.RGBA, gl.UNSIGNED_BYTE, result);
      return result;
    };
    const idle = render(false),
      active = render(true);
    let changed = 0;
    for (let i = 0; i < idle.length; i += 4)
      if (
        idle[i] !== active[i] ||
        idle[i + 1] !== active[i + 1] ||
        idle[i + 2] !== active[i + 2]
      )
        changed++;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return { changed, center: idle[(16 * 32 + 16) * 4], outside: idle[0] };
  }, pointerRefractionShader);
  expect(result.center).toBe(40);
  expect(result.outside).toBe(210);
  expect(result.changed).toBe(0);
});
