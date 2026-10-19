import { expect, test } from "@playwright/test";

test("resizing repaints the cleared glass canvas before the frame is presented", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = { clear: 0, paint: 0, samples: 0, blank: 0 };
    const scope = window as typeof window & { resizePaintAudit: typeof state };
    scope.resizePaintAudit = state;
    for (const name of ["width", "height"]) {
      const descriptor = Object.getOwnPropertyDescriptor(
        HTMLCanvasElement.prototype,
        name,
      )!;
      Object.defineProperty(HTMLCanvasElement.prototype, name, {
        ...descriptor,
        set(value) {
          descriptor.set!.call(this, value);
          if (this.parentElement?.hasAttribute("data-glass-scene"))
            state.clear = performance.now();
        },
      });
    }
    const prototype = WebGL2RenderingContext.prototype;
    let framebuffer: WebGLFramebuffer | null = null;
    const bind = prototype.bindFramebuffer;
    prototype.bindFramebuffer = function (target, buffer) {
      framebuffer = buffer;
      return bind.call(this, target, buffer);
    };
    for (const name of ["drawArrays", "drawElements"] as const) {
      const draw = prototype[name];
      prototype[name] = function (...args: number[]) {
        const result = draw.apply(
          this,
          args as [number, number, number, number],
        );
        const canvas = this.canvas as HTMLCanvasElement;
        if (
          !framebuffer &&
          canvas.parentElement?.hasAttribute("data-glass-scene")
        )
          state.paint = performance.now();
        return result;
      };
    }
  });
  await page.goto("/");
  const scene = page.locator("[data-glass-scene]");
  await expect(scene).toHaveAttribute("data-ready", "true");
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    const scope = window as typeof window & {
      resizePaintAudit: {
        clear: number;
        paint: number;
        samples: number;
        blank: number;
      };
    };
    new ResizeObserver(() => {
      const state = scope.resizePaintAudit;
      state.samples++;
      if (state.clear > state.paint) state.blank++;
    }).observe(document.querySelector("[data-glass-scene]")!);
  });
  for (const area of ["hero", "footer"]) {
    if (area === "footer") {
      const scale = await page.evaluate(() =>
        navigator.maxTouchPoints > 0 ? devicePixelRatio : 1,
      );
      await page.mouse.wheel(0, 100000 * scale);
      await expect(scene).toHaveAttribute("data-scene", "thank-you");
      await expect(page.locator("[data-footer-thanks]")).toHaveAttribute(
        "data-glass-ready",
        "true",
      );
    }
    for (const width of [960, 880, 780, 750, 720, 780, 880, 960]) {
      await page.setViewportSize({ width, height: 871 });
      await page.evaluate(() => new Promise(requestAnimationFrame));
    }
  }
  const audit = await page.evaluate(
    () =>
      (
        window as typeof window & {
          resizePaintAudit: { samples: number; blank: number };
        }
      ).resizePaintAudit,
  );
  expect(audit.samples).toBeGreaterThan(8);
  expect(audit.blank).toBe(0);
  await expect(scene).toHaveAttribute("data-ready", "true");
});
