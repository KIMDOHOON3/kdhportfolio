import { expect, test, type Page } from "@playwright/test";
import { GALLERY_ASSETS } from "../../src/app/data/staticAssets";

const hit = (page: Page, fraction = 0.5) =>
  page.locator("[data-gallery-canvas]").evaluate((host, x) => {
    const rect = host.getBoundingClientRect();
    const point = {
      x: rect.left + rect.width * x,
      y: rect.top + rect.height * 0.4,
      id: null as number | null,
    };
    host.dispatchEvent(new CustomEvent("gallery:hover", { detail: point }));
    return point.id;
  }, fraction);

test("desktop film reaches both viewport edges while copy and choices share a centered width", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop", "Wide desktop framing only.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#work");
  await expect(page.locator("[data-gallery-canvas]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect
    .poll(() =>
      page.evaluate(
        (urls) =>
          performance
            .getEntriesByType("resource")
            .filter((entry) => urls.includes(new URL(entry.name).pathname))
            .length,
        Object.values(GALLERY_ASSETS),
      ),
    )
    .toBe(4);
  for (const width of [1280, 1920, 2499]) {
    await page.setViewportSize({ width, height: 1120 });
    await page.locator("[data-scroll-viewport]").evaluate((element) => {
      element.scrollTop +=
        document.querySelector("[data-gallery-canvas]")!.getBoundingClientRect()
          .top - 100;
    });
    await expect.poll(() => hit(page)).toBe(1);
    for (const edge of [0.01, 0.99]) {
      await expect.poll(() => hit(page, edge)).not.toBeNull();
      expect(await hit(page, edge)).not.toBe(1);
    }
    const gallery = page.locator("[data-project-gallery]");
    const copy = (await gallery
      .locator("[class*='informationFrame']")
      .boundingBox())!;
    const choices = (await page
      .getByRole("navigation", { name: "프로젝트 바로 선택" })
      .boundingBox())!;
    expect(copy.width).toBeLessThanOrEqual(1600);
    expect(Math.abs(copy.x + copy.width / 2 - width / 2)).toBeLessThan(1);
    expect(Math.abs(copy.x - choices.x)).toBeLessThan(1);
    expect(Math.abs(copy.width - choices.width)).toBeLessThan(1);
    expect(
      await page
        .locator("[data-scroll-viewport]")
        .evaluate((element) => element.scrollWidth - element.clientWidth),
    ).toBe(0);
    await page.screenshot({
      path: info.outputPath(`film-${width}.png`),
      scale: "css",
    });
  }
});

test("changing ribbon width preserves the selected work and the existing canvas", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Exercise both framing modes in one context.",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#work");
  const host = page.locator("[data-gallery-canvas]");
  await expect(host).toHaveAttribute("data-ready", "true");
  const canvas = await host.locator("canvas").elementHandle();
  await page
    .getByRole("navigation", { name: "프로젝트 바로 선택" })
    .getByRole("button", { name: /Kia Worldwide/ })
    .click();
  for (const width of [2499, 390, 1920, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => hit(page)).toBe(3);
    await expect(page.locator("[data-selected-project]")).toHaveAttribute(
      "data-selected-project",
      "3",
    );
    expect(
      await canvas!.evaluate(
        (element) =>
          element === document.querySelector("[data-gallery-canvas] canvas"),
      ),
    ).toBe(true);
  }
});

test("repeated works at the two film edges move in from the clicked side", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Both copies are visible on wide desktops.",
  );
  await page.setViewportSize({ width: 2499, height: 1120 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#work");
  const host = page.locator("[data-gallery-canvas]");
  await expect(host).toHaveAttribute("data-ready", "true");
  await expect.poll(() => hit(page, 0.99)).toBe(5);
  await expect.poll(() => hit(page, 0.01)).toBe(5);
  await page
    .getByRole("button", { name: "갤러리 자동 회전 일시 정지" })
    .click();
  await page.clock.install();
  for (const [edge, passingWork] of [
    [0.99, 3],
    [0.01, 4],
  ]) {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page
      .getByRole("navigation", { name: "프로젝트 바로 선택" })
      .getByRole("button", { name: /LEXUS/ })
      .click();
    await page.clock.runFor(32);
    expect(await hit(page)).toBe(1);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await host.evaluate((element, x) => {
      const rect = element.getBoundingClientRect();
      element.dispatchEvent(
        new CustomEvent("gallery:pick", {
          detail: {
            x: rect.left + rect.width * x,
            y: rect.top + rect.height * 0.4,
          },
        }),
      );
    }, edge);
    await page.clock.runFor(140);
    // The adjacent frame must pass the center from that side, rather than the
    // other copy of the same project rotating in the opposite direction.
    expect(await hit(page)).toBe(passingWork);
  }
});
