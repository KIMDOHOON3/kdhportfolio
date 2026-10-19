import { expect, test } from "@playwright/test";

test("mobile toolbar height changes preserve section positions and glass buffers", async ({
  page,
}, info) => {
  test.skip(
    !info.project.use.isMobile,
    "Mobile browser chrome changes height during scrolling.",
  );
  await page.addInitScript(() => {
    const audit = { allocations: 0 };
    (window as typeof window & { settleAudit: typeof audit }).settleAudit =
      audit;
    for (const method of [
      "texImage2D",
      "renderbufferStorageMultisample",
    ] as const) {
      const original = WebGL2RenderingContext.prototype[method];
      Object.defineProperty(WebGL2RenderingContext.prototype, method, {
        value: function (...args: unknown[]) {
          audit.allocations++;
          return Reflect.apply(original, this, args);
        },
      });
    }
  });
  await page.goto("/");
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
  await page.evaluate(() => document.fonts.ready);
  const { width, height } = page.viewportSize()!;
  const metrics = () =>
    page.evaluate(() => {
      const viewport = document.querySelector<HTMLElement>(
        "[data-scroll-viewport]",
      )!;
      const canvas = document.querySelector<HTMLCanvasElement>(
        "[data-glass-scene] canvas",
      )!;
      return {
        top: viewport.scrollTop,
        anchors: ["#work", "#about", "[data-journey-ending]"].map(
          (selector) =>
            document.querySelector(selector)!.getBoundingClientRect().top +
            viewport.scrollTop,
        ),
        canvas: [canvas.width, canvas.height],
        allocations: (
          window as typeof window & { settleAudit: { allocations: number } }
        ).settleAudit.allocations,
        entry: document
          .querySelector("[data-scroll-story]")
          ?.getAttribute("data-entry-progress"),
      };
    });
  for (const region of ["hero", "journey"]) {
    await page.locator("[data-scroll-viewport]").evaluate((element, region) => {
      element.scrollTop =
        region === "hero"
          ? 100
          : document
              .querySelector("[data-scroll-story]")!
              .getBoundingClientRect().top +
            element.scrollTop -
            element.clientHeight * 0.4;
    }, region);
    await page.waitForTimeout(600);
    const before = await metrics();
    const samples = [];
    for (const delta of [28, 56, 28, 0]) {
      await page.setViewportSize({ width, height: height + delta });
      await page.waitForTimeout(120);
      samples.push(await metrics());
    }
    const after = await metrics();
    await info.attach(`${region}-height-change`, {
      body: JSON.stringify({ before, samples, after }, null, 2),
      contentType: "application/json",
    });
    expect(after.allocations - before.allocations).toBe(0);
    for (const sample of samples) {
      expect(sample.canvas).toEqual(before.canvas);
      expect(sample.top).toBe(before.top);
      for (let index = 0; index < before.anchors.length; index++)
        expect(
          Math.abs(sample.anchors[index] - before.anchors[index]),
        ).toBeLessThan(1);
      expect(sample.entry).toBe(before.entry);
    }
  }
  // Expanding the visible area must still reveal the footer immediately,
  // even though the animation's layout height remains frozen.
  await page.locator("[data-scroll-viewport]").evaluate((element, height) => {
    const footer = document.querySelector("#contact")!;
    element.scrollTop =
      footer.getBoundingClientRect().top + element.scrollTop - height - 10;
  }, height);
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-footer-geometry",
    "glass-path",
  );
  await page.setViewportSize({ width, height: height + 56 });
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-scene",
    "thank-you",
  );
  await page.setViewportSize({ width: height, height: width });
  await expect
    .poll(() =>
      page
        .locator("[data-scroll-viewport]")
        .evaluate((e) => Number((e as HTMLElement).dataset.layoutHeight)),
    )
    .toBe(width);
  await expect
    .poll(() =>
      page
        .locator("[data-glass-scene] canvas")
        .evaluate((e) => (e as HTMLCanvasElement).width),
    )
    .toBe(height * 2);
});
