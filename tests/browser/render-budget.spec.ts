import { expect, test } from "@playwright/test";
import { FONT_ASSETS } from "../../src/app/data/staticAssets";

test("copy fonts use small subsets with matching metrics and a complete Unicode fallback", async ({
  page,
}) => {
  const fonts: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "font")
      fonts.push(new URL(request.url()).pathname);
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
  expect(fonts).toContain(FONT_ASSETS["PortfolioSans-Regular.woff2"]);
  expect(fonts).toContain(FONT_ASSETS["PortfolioSans-Bold.woff2"]);
  expect(fonts).toContain(FONT_ASSETS["Pacifico-Footer.woff2"]);
  expect(fonts).not.toContain("/font/Pacifico-Regular.ttf");
  expect(fonts).not.toContain(FONT_ASSETS["Pretendard-Regular.woff2"]);
  expect(fonts).not.toContain(FONT_ASSETS["Pretendard-Bold.woff2"]);

  const widths = await page.evaluate(async (originalFont) => {
    const original = new FontFace("OriginalMetrics", `url("${originalFont}")`);
    await original.load();
    document.fonts.add(original);
    // This syllable is absent from the initial copy: the full font must still work.
    await document.fonts.load('16px "Pretendard-Regular"', "힣");
    const ctx = document.createElement("canvas").getContext("2d")!;
    return [
      "화면의 디테일과 데이터의 흐름",
      "Next.js TypeScript CSS Modules",
      "힣",
    ].map((text) => {
      ctx.font = '16px "Pretendard-Regular"';
      const actual = ctx.measureText(text).width;
      ctx.font = '16px "OriginalMetrics"';
      return Math.abs(actual - ctx.measureText(text).width);
    });
  }, FONT_ASSETS["Pretendard-Regular.woff2"]);
  expect(Math.max(...widths)).toBeLessThan(0.01);
  expect(fonts).toContain(FONT_ASSETS["Pretendard-Regular.woff2"]);
});

test("large retina glass keeps its drawing buffer within budget without losing device detail", async ({
  browser,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "One high-DPI context covers the large-display allocation.",
  );
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  try {
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${process.env.PORTFOLIO_URL ?? "http://localhost:3010"}/`);
    const scene = page.locator("[data-glass-scene]");
    await expect(scene).toHaveAttribute("data-ready", "true");
    for (const target of ["#home", "#contact"]) {
      await page.locator(target).scrollIntoViewIfNeeded();
      if (target === "#contact")
        await expect(scene).toHaveAttribute("data-scene", "thank-you");
      const size = await scene.locator("canvas").evaluate((canvas) => ({
        width: (canvas as HTMLCanvasElement).width,
        height: (canvas as HTMLCanvasElement).height,
      }));
      expect(size.width * size.height).toBeLessThanOrEqual(4_010_000);
      expect(size.width).toBeGreaterThan(1920 * 1.3);
    }
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test("gallery omits rear draw calls and reuses programs and line measurements after detail return", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const counts = { draws: 0, frames: 0, programs: 0, ranges: 0 };
    Object.assign(window, { renderCounts: counts });
    const prototype = WebGL2RenderingContext.prototype;
    const isGallery = (gl: WebGL2RenderingContext) =>
      (gl.canvas as HTMLCanvasElement).hasAttribute(
        "data-curved-gallery-canvas",
      );
    const draw = prototype.drawElements;
    prototype.drawElements = function (...args) {
      if (isGallery(this)) counts.draws++;
      return draw.apply(this, args);
    };
    const clear = prototype.clear;
    prototype.clear = function (...args) {
      if (isGallery(this)) counts.frames++;
      return clear.apply(this, args);
    };
    const program = prototype.createProgram;
    prototype.createProgram = function () {
      if (isGallery(this)) counts.programs++;
      return program.call(this);
    };
    const rect = Range.prototype.getBoundingClientRect;
    Range.prototype.getBoundingClientRect = function () {
      if (
        this.commonAncestorContainer.parentElement?.closest(
          "[data-gallery-line-source]",
        )
      )
        counts.ranges++;
      return rect.call(this);
    };
  });
  const counts = () =>
    page.evaluate(
      () =>
        (
          window as Window & {
            renderCounts?: {
              draws: number;
              frames: number;
              programs: number;
              ranges: number;
            };
          }
        ).renderCounts!,
    );
  await page.goto("/#work");
  await expect(page.locator("[data-gallery-canvas]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const before = await counts();
  await expect
    .poll(async () => (await counts()).frames)
    .toBeGreaterThan(before.frames + 10);
  const after = await counts();
  expect(
    (after.draws - before.draws) / (after.frames - before.frames),
  ).toBeLessThanOrEqual(10);
  await page
    .getByRole("button", { name: "갤러리 자동 회전 일시 정지" })
    .click();
  const filters = page.getByRole("group", { name: "프로젝트 필터" });
  await filters.getByRole("button", { name: "실무 02", exact: true }).click();
  await expect(page.locator("[data-gallery-panel]")).toHaveCount(2);
  await filters.getByRole("button", { name: "전체 04", exact: true }).click();
  await expect(page.locator("[data-gallery-panel]")).toHaveCount(4);
  await page
    .getByRole("navigation", { name: "프로젝트 바로 선택" })
    .getByRole("button", { name: /LEXUS/ })
    .click();
  await expect(page.locator('[data-gallery-panel="1"]')).toHaveAttribute(
    "data-active",
    "true",
  );
  await page.evaluate(() => document.fonts.ready);
  const baseline = await counts();
  await page
    .getByRole("link", { name: "LEXUS 프로젝트 보기", exact: true })
    .click();
  await expect(page.locator("[data-route-transition]")).toHaveAttribute(
    "data-active",
    "false",
  );
  await page.goBack();
  await expect(page.locator("[data-route-transition]")).toHaveAttribute(
    "data-active",
    "false",
  );
  await expect(page.locator("[data-gallery-canvas]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.waitForTimeout(200);
  const returned = await counts();
  expect(returned.programs).toBe(before.programs);
  expect(returned.ranges - baseline.ranges).toBe(0);
  await test.info().attach("render-budget", {
    body: JSON.stringify(
      {
        drawsPerFrame:
          (after.draws - before.draws) / (after.frames - before.frames),
        programsBefore: before.programs,
        programsAfter: returned.programs,
        rangeReadsOnReturn: returned.ranges - baseline.ranges,
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
});
