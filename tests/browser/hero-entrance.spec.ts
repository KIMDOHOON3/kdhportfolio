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
  await page.waitForFunction(() => {
    const scene = document.querySelector<HTMLElement>("[data-glass-scene]")!;
    return Number(scene.dataset.helloStroke) > 0.75;
  });
  // The orbs wait for the completed writing, then pop left to right.
  for (const name of ["claude", "figma", "codex"])
    await expect(scene).toHaveAttribute(`data-orb-${name}`, "0.0000");
  for (const [name, next] of [
    ["claude", "figma"],
    ["figma", "codex"],
  ]) {
    await page.waitForFunction((name) => {
      const scene = document.querySelector<HTMLElement>("[data-glass-scene]")!;
      return Number(scene.getAttribute(`data-orb-${name}`)) > 0.2;
    }, name);
    await expect(scene).toHaveAttribute("data-hello-stroke", "1.0000");
    await expect(scene).toHaveAttribute(`data-orb-${next}`, "0.0000");
    await expect(page.locator("[data-intro-summary]")).toHaveCSS(
      "opacity",
      "0",
    );
  }
  await expect(scene).toHaveAttribute("data-hero-entrance", "done");
  for (const name of ["claude", "figma", "codex"])
    await expect(scene).toHaveAttribute(`data-orb-${name}`, "1.0000");
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

test("wheel, keys, touch and anchors stay locked until the project CTA finishes", async ({
  page,
}, info) => {
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**${GLASS_ASSETS.hello}`, async (route) => {
    await waiting;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const viewport = page.locator("[data-scroll-viewport]");
  const scene = page.locator("[data-glass-scene]");
  const { width, height } = page.viewportSize()!;
  try {
    await expect(viewport).toHaveAttribute("data-intro-lock", "true");
    await page.mouse.move(width * 0.5, height * 0.65);
    await page.mouse.wheel(0, 650);
    await viewport.focus();
    for (const key of ["PageDown", "End", "ArrowDown", "Space"])
      await page.keyboard.press(key);
    await viewport.dispatchEvent("pointerdown");
    await page
      .locator("[data-intro-cta]")
      .evaluate((e) => (e as HTMLElement).click());
    if (info.project.use.isMobile) {
      const cdp = await page.context().newCDPSession(page);
      const point = (y: number) => ({ x: width * 0.5, y, id: 1 });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [point(height * 0.75)],
      });
      for (let step = 1; step <= 6; step++)
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [point(height * (0.75 - step * 0.06))],
        });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await cdp.detach();
    }
    // Native focus/scrollTo attempts must not jump past the intro either.
    await viewport.evaluate((e) => {
      e.scrollTop = 500;
    });
    await page.waitForTimeout(200);
    expect(await viewport.evaluate((e) => e.scrollTop)).toBe(0);
    await expect(viewport).toHaveAttribute("data-intro", "playing");
    await expect(viewport).toHaveAttribute("data-intro-copy", "waiting");
    expect(new URL(page.url()).hash).toBe("");
  } finally {
    release();
  }
  await expect(scene).toHaveAttribute("data-hero-entrance", "revealing");
  await page.mouse.wheel(0, 650);
  await page.waitForTimeout(200);
  await expect(scene).toHaveAttribute("data-hero-entrance", "revealing");
  expect(await viewport.evaluate((e) => e.scrollTop)).toBe(0);
  await page.waitForFunction(
    () =>
      document.querySelector<HTMLElement>("[data-scroll-viewport]")!.dataset
        .introCopy === "ready",
  );
  await expect(viewport).toHaveAttribute("data-intro-lock", "true");
  await page.mouse.wheel(0, 650);
  await expect(viewport).toHaveAttribute("data-intro", "playing");
  await expect(viewport).toHaveAttribute("data-intro", "done");
  await expect(viewport).not.toHaveAttribute("data-intro-lock", "true");
  await expect(page.locator("[data-intro-cta]")).toHaveCSS("opacity", "1");
  await expect(page.locator("[data-intro-cta]")).toHaveCSS("scale", "none");
  await page.waitForTimeout(150);
  expect(await viewport.evaluate((e) => e.scrollTop)).toBe(0);
  await page.mouse.wheel(0, 650);
  await expect
    .poll(() => viewport.evaluate((e) => e.scrollTop))
    .toBeGreaterThan(100);
});

test("reduced motion and direct section links skip the entrance without a scroll lock", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
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
  await expect(page.locator("[data-scroll-viewport]")).not.toHaveAttribute(
    "data-intro-lock",
    "true",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#work");
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
  await expect(page.locator("[data-scroll-viewport]")).not.toHaveAttribute(
    "data-intro-lock",
    "true",
  );
});

test("a failed model still completes the copy and releases scrolling", async ({
  page,
}) => {
  await page.route(`**${GLASS_ASSETS.hello}`, (route) => route.abort());
  await page.goto("/");
  const viewport = page.locator("[data-scroll-viewport]");
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-failed",
    "true",
  );
  await expect(viewport).toHaveAttribute("data-intro", "done");
  await expect(viewport).not.toHaveAttribute("data-intro-lock", "true");
  await expect(page.locator("[data-intro-cta]")).toHaveCSS("opacity", "1");
  await page.mouse.move(150, 300);
  await page.mouse.wheel(0, 600);
  await expect
    .poll(() => viewport.evaluate((e) => e.scrollTop))
    .toBeGreaterThan(100);
});

test("without JavaScript the page remains scrollable", async ({
  browser,
  baseURL,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "The script-free fallback does not depend on viewport.",
  );
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  try {
    const page = await context.newPage();
    await page.goto("/");
    const viewport = page.locator("[data-scroll-viewport]");
    await expect(viewport).not.toHaveAttribute("data-intro-lock", "true");
    await expect(viewport).toHaveCSS("overflow-y", "auto");
    for (const section of await page.locator("[data-intro-below]").all())
      await expect(section).toHaveCSS("visibility", "visible");
    await page.mouse.move(200, 300);
    await page.mouse.wheel(0, 650);
    await expect
      .poll(() => viewport.evaluate((e) => e.scrollTop))
      .toBeGreaterThan(100);
  } finally {
    await context.close();
  }
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
