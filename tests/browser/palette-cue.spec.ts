import { expect, test } from "@playwright/test";

test("the page and rendered hero share a cool white palette", async ({
  page,
}, info) => {
  await page.goto("/");
  const scene = page.locator("[data-glass-scene]");
  await expect(scene).toHaveAttribute("data-ready", "true");
  await expect(scene).toHaveAttribute("data-failed", "false");
  await expect(scene).toHaveAttribute("data-hero-entrance", "done");
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(244, 247, 250)",
  );
  await expect(page.locator("body")).toHaveCSS("color", "rgb(32, 38, 45)");
  const path = info.outputPath("ice-white-hero.png");
  const bytes = await page.screenshot({ path, scale: "css" });
  await info.attach("ice-white-hero", { path, contentType: "image/png" });
  const color = await page.evaluate(async (data) => {
    const image = await createImageBitmap(
      await (await fetch(`data:image/png;base64,${data}`)).blob(),
    );
    const canvas = new OffscreenCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    image.close();
    // An uncovered strip of the actual WebGL background, outside the lettering.
    const pixels = ctx.getImageData(
      2,
      Math.round(canvas.height * 0.25),
      4,
      Math.round(canvas.height * 0.35),
    ).data;
    let red = 0,
      blue = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      red += pixels[i];
      blue += pixels[i + 2];
    }
    return { red: red / (pixels.length / 4), blue: blue / (pixels.length / 4) };
  }, bytes.toString("base64"));
  expect(color.red).toBeGreaterThan(225);
  expect(color.blue - color.red).toBeGreaterThanOrEqual(0);
  expect(color.blue - color.red).toBeLessThan(15);
});

test("the hero arrow rolls automatically on desktop and mobile and respects reduced motion", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
  const button = page.getByRole("link", {
    name: "프로젝트 살펴보기",
    exact: true,
  });
  const arrow = button.locator("svg").first();
  await expect(arrow).toHaveCSS("animation-iteration-count", "infinite");
  const expectDownward = async () => {
    await expect
      .poll(() =>
        arrow.evaluate((e) => {
          const matrix = new DOMMatrixReadOnly(getComputedStyle(e).transform);
          return [matrix.a, matrix.b, matrix.c, matrix.d].map(Math.round);
        }),
      )
      .toEqual([0, 1, -1, 0]);
  };
  await expectDownward();
  await expect
    .poll(() =>
      arrow.evaluate(
        (e) =>
          e
            .getAnimations()
            .find((a) => a.effect?.getTiming().iterations === Infinity)
            ?.effect?.getComputedTiming().currentIteration ?? 0,
      ),
    )
    .toBeGreaterThanOrEqual(1);
  const position = await arrow.evaluate((e) => getComputedStyle(e).transform);
  await expect
    .poll(() => arrow.evaluate((e) => getComputedStyle(e).transform))
    .not.toBe(position);
  if (!info.project.use.isMobile) {
    await button.hover();
    await expect(arrow).toHaveCSS("animation-iteration-count", "infinite");
    await expectDownward();
    await page.mouse.move(2, 2);
    await expect(arrow).toHaveCSS("animation-iteration-count", "infinite");
    await button.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    await expect(arrow).toHaveCSS("animation-iteration-count", "infinite");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(arrow).toHaveCSS("animation-name", "none");
  await button.press("Enter");
  await page.waitForURL("**/#work");
});
