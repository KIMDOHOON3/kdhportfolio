import { expect, test } from "@playwright/test";

test("first paint never shows a blue HTML hello behind the glass", async ({
  page,
}, info) => {
  let release!: () => void;
  const scripts = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/_next/static/chunks/**", async (route) => {
    if (route.request().resourceType() === "script") await scripts;
    await route.continue();
  });
  try {
    await page.goto("/", { waitUntil: "commit" });
    const scene = page.locator("[data-glass-scene]");
    await expect(scene).toHaveAttribute("data-ready", "false");
    await expect(scene.locator("span")).toHaveCount(0);
    await expect(page.locator("[data-footer-thanks]")).toHaveText("THANK YOU");
    const path = info.outputPath("startup-before-webgl.png");
    await page.screenshot({ path, scale: "css", animations: "disabled" });
    await info.attach("startup-before-webgl", {
      path,
      contentType: "image/png",
    });
  } finally {
    release();
  }
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.locator("[data-glass-scene] span")).toHaveCount(0);
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-failed",
    "false",
  );
});

test("footer lettering is rendered by WebGL and survives context restoration", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#contact");
  const scene = page.locator("[data-glass-scene]");
  const heading = page.locator("[data-footer-thanks]");
  const footerAlignment = () =>
    page.locator("#contact").evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return Math.abs(rect.top - Math.max(0, innerHeight - rect.height));
    });
  await expect(scene).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(footerAlignment).toBeLessThan(1.5);
  // Reproduce late font/story sizing deterministically: before user input the
  // initial deep link must stay aligned even if preceding content grows.
  await page.locator("#contact").evaluate((footer) => {
    const spacer = document.createElement("div");
    spacer.id = "late-layout-spacer";
    spacer.style.height = "80px";
    footer.before(spacer);
  });
  await expect.poll(footerAlignment).toBeLessThan(1.5);
  await page.locator("#late-layout-spacer").evaluate((e) => e.remove());
  await expect.poll(footerAlignment).toBeLessThan(1.5);
  await expect(scene).toHaveAttribute("data-scene", "thank-you");
  await expect(heading).toHaveCSS("color", "rgba(0, 0, 0, 0)");
  const rect = (await heading.boundingBox())!;
  const clip = {
    x: Math.floor(rect.x),
    y: Math.floor(rect.y),
    width: Math.ceil(rect.width),
    height: Math.ceil(rect.height),
  };
  const actual = await page.screenshot({ clip, scale: "css" });
  // With a transparent semantic heading, the visible heading region must have
  // canvas pixels. Also inspect the attached crop for actual beveled outlines;
  // this difference alone includes the illuminated background as well.
  const hide = await page.addStyleTag({
    content: "[data-glass-scene] canvas { visibility: hidden !important; }",
  });
  const absent = await page.screenshot({ clip, scale: "css" });
  await hide.evaluate((e) => e.parentNode?.removeChild(e));
  const difference = await page.evaluate(
    async ({ a, b }) => {
      const decode = async (s: string) => {
        const image = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${s}`)).blob(),
        );
        const canvas = new OffscreenCanvas(image.width, image.height);
        const context = canvas.getContext("2d")!;
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height).data;
      };
      const [left, right] = await Promise.all([decode(a), decode(b)]);
      let changed = 0;
      for (let i = 0; i < left.length; i += 4)
        if (
          Math.abs(left[i] - right[i]) +
            Math.abs(left[i + 1] - right[i + 1]) +
            Math.abs(left[i + 2] - right[i + 2]) >
          30
        )
          changed++;
      return changed / (left.length / 4);
    },
    { a: actual.toString("base64"), b: absent.toString("base64") },
  );
  expect(difference).toBeGreaterThan(0.03);
  await info.attach("glass-lettering-crop", {
    body: actual,
    contentType: "image/png",
  });
  const restore = await scene.locator("canvas").evaluate((canvas) => {
    const extension = (canvas as HTMLCanvasElement)
      .getContext("webgl2")
      ?.getExtension("WEBGL_lose_context");
    if (!extension) return false;
    extension.loseContext();
    setTimeout(() => extension.restoreContext(), 750);
    return true;
  });
  expect(restore).toBe(true);
  await expect(scene).toHaveAttribute("data-ready", "false");
  await expect(heading).not.toHaveAttribute("data-glass-ready", "true");
  await expect(heading).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");
  await expect(scene).toHaveAttribute("data-ready", "true");
  await expect(heading).toHaveAttribute("data-glass-ready", "true");
  await expect(scene.locator("span")).toHaveCount(0);
  const path = info.outputPath("glass-thank-you-restored.png");
  await page.screenshot({ path, scale: "css" });
  await info.attach("glass-thank-you-restored", {
    path,
    contentType: "image/png",
  });
  // Following layout must stop as soon as the user chooses another position.
  const { width, height } = page.viewportSize()!;
  const inputScale = await page.evaluate(() =>
    navigator.maxTouchPoints > 0 ? devicePixelRatio : 1,
  );
  const footerTopBeforeInput = await page
    .locator("#contact")
    .evaluate((e) => e.getBoundingClientRect().top);
  await page.mouse.move(width * 0.7, height * 0.5);
  await page.mouse.wheel(0, -80 * inputScale);
  await expect
    .poll(() =>
      page.locator("#contact").evaluate((e) => e.getBoundingClientRect().top),
    )
    .toBeGreaterThan(footerTopBeforeInput + 40);
  const topBeforeLayout = await page
    .locator("[data-scroll-viewport]")
    .evaluate((e) => e.scrollTop);
  await page.locator("#contact").evaluate((footer) => {
    const spacer = document.createElement("div");
    spacer.style.height = "80px";
    footer.before(spacer);
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(
    await page.locator("[data-scroll-viewport]").evaluate((e) => e.scrollTop),
  ).toBe(topBeforeLayout);
});

test("unavailable WebGL leaves the original readable typography", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (/webgl/.test(args[0])) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto("/");
  const scene = page.locator("[data-glass-scene]");
  await expect(scene).toHaveAttribute("data-failed", "true");
  await expect(scene.locator("span")).toHaveText("hello");
  const heading = page.locator("[data-footer-thanks]");
  await expect(heading).toHaveText("THANK YOU");
  await expect(heading).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");
});
