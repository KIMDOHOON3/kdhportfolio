import { expect, test } from "@playwright/test";
import { GLASS_ASSETS } from "../../src/app/data/glassAssets";

test("navigation appears first, and copy waits for the complete glass entrance even on a slow connection", async ({
  page,
}, info) => {
  let release!: () => void;
  const model = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**${GLASS_ASSETS.hello}`, async (route) => {
    await model;
    await route.continue();
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /Shader Error|VALIDATE_STATUS/.test(message.text())
    )
      errors.push(message.text());
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const logo = page.locator("[data-intro-logo]");
    const nav = page.locator("[data-intro-label]");
    const trigger = page.locator("#navTrigger svg");
    await expect(logo).toHaveCSS("opacity", "1");
    if (await page.locator("#navTrigger").isVisible())
      await expect(trigger).toHaveCSS("opacity", "1");
    else
      for (const item of await nav.all())
        await expect(item).toHaveCSS("opacity", "1");
    await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
      "data-intro-copy",
      "waiting",
    );
    // Keep the model blocked past the former fixed 2.7-second intro deadline.
    await page.waitForTimeout(2800);
    await expect(page.locator("[data-intro-summary]")).toHaveCSS(
      "opacity",
      "0",
    );
    await expect(page.locator("[data-intro-cta]")).toHaveCSS("opacity", "0");
    await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
      "data-ready",
      "false",
    );
  } finally {
    release();
  }
  const scene = page.locator("[data-glass-scene]");
  await expect(scene).toHaveAttribute("data-hero-entrance", "revealing");
  await expect(page.locator("[data-intro-summary]")).toHaveCSS("opacity", "0");
  await expect(scene).toHaveAttribute("data-hero-entrance", "done");
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro-copy",
    "ready",
  );
  await expect(page.locator("[data-intro-summary]")).toHaveCSS("opacity", "1");
  await expect(page.locator("[data-intro-cta]")).toHaveCSS("opacity", "1");
  await expect(scene).toHaveAttribute("data-glass-logos", "3");
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
  const path = info.outputPath("hero-entrance-complete.png");
  await page.screenshot({ path, scale: "css" });
  await info.attach("hero-entrance-complete", {
    path,
    contentType: "image/png",
  });
  await page
    .getByRole("link", { name: "LEXUS 프로젝트 보기", exact: true })
    .click();
  await page.getByRole("link", { name: "김도훈 포트폴리오 홈" }).click();
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
  await expect(scene).toHaveAttribute("data-hero-entrance", "done");
  expect(errors).toEqual([]);
});

test("early input releases the entrance immediately and reduced motion skips it", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page
    .locator("[data-scroll-viewport]")
    .dispatchEvent("wheel", { deltaY: 30 });
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
  await expect(page.locator("[data-intro-summary]")).toHaveCSS("opacity", "1");
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-hero-entrance",
    "done",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-hero-entrance",
    "done",
  );
  await expect(page.locator("[data-intro-logo]")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#work");
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
});

test("short portrait webviews keep the full project CTA below the introduction", async ({
  page,
}, info) => {
  test.skip(
    !info.project.use.isMobile,
    "This reproduces the portrait in-app viewport.",
  );
  for (const [width, height] of [
    [360, 590],
    [393, 600],
    [320, 480],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
      "data-intro",
      "done",
    );
    const summary = (await page.locator("[data-intro-summary]").boundingBox())!;
    const cta = page.locator("[data-intro-cta]");
    const button = (await cta.boundingBox())!;
    expect(button.y).toBeGreaterThanOrEqual(summary.y + summary.height + 10);
    expect(Math.abs(button.x - summary.x)).toBeLessThan(2);
    expect(button.x + button.width).toBeLessThanOrEqual(width);
    expect(button.y + button.height).toBeLessThanOrEqual(height);
    expect(summary.width).toBeGreaterThan(width * 0.8);
    const label = await cta
      .locator("span")
      .first()
      .evaluate((element) => ({
        client: element.clientWidth,
        scroll: element.scrollWidth,
      }));
    expect(label.scroll).toBeLessThanOrEqual(label.client + 1);
    const path = info.outputPath(`short-portrait-${width}x${height}.png`);
    await page.screenshot({ path, scale: "css" });
    await info.attach(`short-portrait-${width}x${height}`, {
      path,
      contentType: "image/png",
    });
  }
});
