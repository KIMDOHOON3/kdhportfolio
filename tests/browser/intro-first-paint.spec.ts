import { expect, test } from "@playwright/test";
import { GLASS_ASSETS } from "../../src/data/glassAssets";

test("server HTML locks early scrolling and reveals lower content near 80% without reflow", async ({
  page,
}) => {
  let releaseScripts!: () => void;
  let releaseModel!: () => void;
  const scripts = new Promise<void>((resolve) => {
    releaseScripts = resolve;
  });
  const model = new Promise<void>((resolve) => {
    releaseModel = resolve;
  });
  await page.route("**/_next/static/chunks/**", async (route) => {
    if (route.request().resourceType() === "script") await scripts;
    await route.continue();
  });
  await page.route(`**${GLASS_ASSETS.hello}`, async (route) => {
    await model;
    await route.continue();
  });
  const viewport = page.locator("[data-scroll-viewport]");
  const sections = page.locator("[data-intro-below]");
  const geometry = () =>
    sections.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          top:
            rect.top +
            document.querySelector("[data-scroll-viewport]")!.scrollTop,
          height: rect.height,
        };
      }),
    );
  try {
    await page.goto("/", { waitUntil: "commit" });
    await expect(sections).toHaveCount(4);
    await expect(viewport).not.toHaveAttribute("data-intro-lock", "true");
    await expect(viewport).toHaveCSS("overflow-y", "hidden");
    for (const section of await sections.all())
      await expect(section).toHaveCSS("visibility", "hidden");
    await page.mouse.move(160, 300);
    await page.mouse.wheel(0, 1400);
    await viewport.focus();
    await page.keyboard.press("End");
    await page.waitForTimeout(150);
    expect(await viewport.evaluate((e) => e.scrollTop)).toBe(0);

    releaseScripts();
    await expect(viewport).toHaveAttribute("data-intro-lock", "true");
    await expect(page.locator("[data-journey]")).toHaveAttribute(
      "data-ready",
      "true",
    );
    await page.evaluate(() => document.fonts.ready);
    const before = await geometry();
    releaseModel();
    await page.waitForFunction(
      () =>
        Number(
          document.querySelector<HTMLElement>("[data-glass-scene]")!.dataset
            .helloStroke,
        ) > 0.75,
    );
    await expect(viewport).toHaveAttribute("data-intro-content", "waiting");
    await expect(page.locator("#work")).toHaveCSS("visibility", "hidden");
    await page.waitForFunction(
      () =>
        document.querySelector<HTMLElement>("[data-scroll-viewport]")!.dataset
          .introContent === "ready",
    );
    await expect(viewport).toHaveAttribute("data-intro-lock", "true");
    await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
      "data-hero-entrance",
      "revealing",
    );
    for (const section of await sections.all())
      await expect(section).toHaveCSS("visibility", "visible");
    const after = await geometry();
    for (let i = 0; i < before.length; i++) {
      expect(Math.abs(after[i].top - before[i].top)).toBeLessThan(1);
      expect(Math.abs(after[i].height - before[i].height)).toBeLessThan(1);
    }
    expect(await viewport.evaluate((e) => e.scrollTop)).toBe(0);
    await expect(viewport).toHaveAttribute("data-intro", "done");
    await expect(viewport).toHaveCSS("overflow-y", "auto");
    await page.mouse.wheel(0, 700);
    await expect
      .poll(() => viewport.evaluate((e) => e.scrollTop))
      .toBeGreaterThan(100);
  } finally {
    releaseScripts();
    releaseModel();
  }
});
