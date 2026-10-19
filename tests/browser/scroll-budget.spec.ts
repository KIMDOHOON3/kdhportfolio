import { expect, test } from "@playwright/test";

test("forward and reverse hero scroll reuse GPU resources and obey the render budget", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    const audit = { paints: 0, allocations: 0, uploads: 0, links: 0, rects: 0 };
    (window as typeof window & { scrollBudget: typeof audit }).scrollBudget =
      audit;
    const rect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      audit.rects++;
      return rect.call(this);
    };
    const gl = WebGL2RenderingContext.prototype;
    let framebuffer: WebGLFramebuffer | null = null;
    const bind = gl.bindFramebuffer;
    gl.bindFramebuffer = function (target, buffer) {
      if (target === this.FRAMEBUFFER || target === this.DRAW_FRAMEBUFFER)
        framebuffer = buffer;
      return bind.call(this, target, buffer);
    };
    for (const method of ["drawArrays", "drawElements"] as const) {
      const draw = gl[method];
      gl[method] = function (...args: number[]) {
        if (!framebuffer) audit.paints++;
        return draw.apply(this, args as [number, number, number, number]);
      };
    }
    for (const [method, key] of [
      ["texImage2D", "allocations"],
      ["renderbufferStorageMultisample", "allocations"],
      ["bufferData", "uploads"],
      ["linkProgram", "links"],
    ] as const) {
      const original = gl[method];
      Object.defineProperty(gl, method, {
        value: function (...args: unknown[]) {
          audit[key]++;
          return Reflect.apply(original, this, args);
        },
      });
    }
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
  // Optional pointer shader preparation happens during the first idle gap.
  await page.waitForTimeout(600);
  const result = await page.evaluate(async () => {
    const audit = (
      window as typeof window & {
        scrollBudget: {
          paints: number;
          allocations: number;
          uploads: number;
          links: number;
          rects: number;
        };
      }
    ).scrollBudget;
    const before = { ...audit };
    const viewport = document.querySelector<HTMLElement>(
      "[data-scroll-viewport]",
    )!;
    const canvas = document.querySelector("[data-glass-scene] canvas");
    const start = performance.now();
    await new Promise<void>((resolve) => {
      let step = 0;
      const tick = () => {
        const progress = step <= 80 ? step / 80 : (160 - step) / 80;
        viewport.scrollTop = Math.round(viewport.clientHeight * 0.8 * progress);
        if (++step <= 160) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    return {
      elapsed: performance.now() - start,
      paints: audit.paints - before.paints,
      allocations: audit.allocations - before.allocations,
      uploads: audit.uploads - before.uploads,
      links: audit.links - before.links,
      rects: audit.rects - before.rects,
      sameCanvas:
        canvas === document.querySelector("[data-glass-scene] canvas"),
    };
  });
  await info.attach("hero-scroll-budget", {
    body: JSON.stringify(result, null, 2),
    contentType: "application/json",
  });
  expect(result.sameCanvas).toBe(true);
  expect(result.allocations).toBe(0);
  expect(result.uploads).toBe(0);
  expect(result.links).toBe(0);
  expect(result.rects).toBeLessThanOrEqual(3);
  expect(result.paints).toBeGreaterThan(5);
  expect(result.paints).toBeLessThanOrEqual(
    Math.ceil((result.elapsed / 1000) * 65) + 3,
  );
});

test("mobile touch scroll uses native momentum without snapping back", async ({
  page,
}, info) => {
  test.skip(
    !info.project.use.isMobile,
    "Native touch scrolling is a mobile path.",
  );
  await page.goto("/");
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
  const cdp = await page.context().newCDPSession(page);
  const { width, height } = page.viewportSize()!;
  const point = (y: number) => ({ x: width * 0.5, y, id: 1 });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point(height * 0.75)],
  });
  for (let step = 1; step <= 10; step++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [point(height * (0.75 - step * 0.035))],
    });
    await page.waitForTimeout(20);
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  const viewport = page.locator("[data-scroll-viewport]");
  await expect
    .poll(() => viewport.evaluate((e) => e.scrollTop))
    .toBeGreaterThan(height * 0.2);
  const released = await viewport.evaluate((e) => e.scrollTop);
  await page.waitForTimeout(400);
  expect(await viewport.evaluate((e) => e.scrollTop)).toBeGreaterThanOrEqual(
    released - 2,
  );
});
