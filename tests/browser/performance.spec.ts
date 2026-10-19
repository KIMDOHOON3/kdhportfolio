import { expect, test } from "@playwright/test";
import { GLASS_ASSETS } from "../../src/app/data/glassAssets";

test("the first screen only loads its lettering and scroll keeps connection geometry stable", async ({
  page,
}) => {
  const models: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/models/"))
      models.push(new URL(request.url()).pathname);
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const scene = page.locator("[data-glass-scene]");
  await expect(scene).toHaveAttribute("data-ready", "true");
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
  await expect(scene).toHaveAttribute("data-hello-geometry", "glass-mesh");
  expect(models.filter((path) => path === GLASS_ASSETS.hello)).toHaveLength(1);
  expect(models).not.toContain(GLASS_ASSETS.footer);
  const paths = page.locator("[data-connection-path]");
  const geometry = await paths.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("d")),
  );
  expect(geometry.every(Boolean)).toBe(true);
  const mutations = await page.evaluate(async () => {
    const drawing = document.querySelector("[data-journey-connection]")!;
    const records: MutationRecord[] = [];
    const observer = new MutationObserver((items) => records.push(...items));
    observer.observe(drawing, {
      subtree: true,
      attributes: true,
      attributeFilter: ["d"],
    });
    const viewport = document.querySelector<HTMLElement>(
      "[data-scroll-viewport]",
    )!;
    const line = document
      .querySelector("[data-journey-line]")!
      .getBoundingClientRect();
    const start = line.bottom + viewport.scrollTop - innerHeight;
    for (let step = 0; step < 12; step++) {
      viewport.scrollTop = start + step * 12;
      await new Promise(requestAnimationFrame);
    }
    observer.disconnect();
    return records.length;
  });
  expect(mutations).toBe(0);
  await expect(paths).toHaveCount(7);
  expect(
    await paths.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("d")),
    ),
  ).toEqual(geometry);
  const scale = await page.evaluate(() =>
    navigator.maxTouchPoints > 0 ? devicePixelRatio : 1,
  );
  await page.mouse.wheel(0, 100000 * scale);
  await expect(scene).toHaveAttribute("data-footer-geometry", "glass-path");
  await expect(page.locator("[data-footer-thanks]")).toHaveAttribute(
    "data-glass-ready",
    "true",
  );
  // Measure steady footer scrolling after the initial arrival/layout settles.
  await expect
    .poll(() =>
      page
        .locator("[data-scroll-viewport]")
        .evaluate(
          (element) =>
            element.scrollHeight - element.clientHeight - element.scrollTop,
        ),
    )
    .toBeLessThan(1.5);
  const textMeasurements = await page.evaluate(async () => {
    const original = Range.prototype.getBoundingClientRect;
    let count = 0;
    Range.prototype.getBoundingClientRect = function () {
      count++;
      return original.call(this);
    };
    const viewport = document.querySelector<HTMLElement>(
      "[data-scroll-viewport]",
    )!;
    const bottom = viewport.scrollHeight - viewport.clientHeight;
    try {
      for (let step = 0; step <= 12; step++) {
        viewport.scrollTop = bottom - 120 + step * 10;
        await new Promise(requestAnimationFrame);
      }
    } finally {
      Range.prototype.getBoundingClientRect = original;
    }
    return count;
  });
  expect(textMeasurements).toBe(0);
});

test("detail defers all 3D work and reuses its canvas and models across navigation", async ({
  page,
}) => {
  const resources: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith("/models/") || path.startsWith("/images/tools/"))
      resources.push(path);
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/work/1");
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const scene = page.locator("[data-glass-scene]");
  await expect(scene.locator("canvas")).toHaveCount(0);
  expect(resources).toEqual([]);
  const footer = async () => {
    const scale = await page.evaluate(() =>
      navigator.maxTouchPoints > 0 ? devicePixelRatio : 1,
    );
    await page.mouse.move(100, 200);
    await page.mouse.wheel(0, 100000 * scale);
    await expect(scene).toHaveAttribute("data-ready", "true");
    await expect(scene).toHaveAttribute("data-scene", "thank-you");
    await expect(page.locator("[data-footer-thanks]")).toHaveAttribute(
      "data-glass-ready",
      "true",
    );
  };
  await footer();
  expect(resources).toEqual([GLASS_ASSETS.footer]);
  const canvas = await scene.locator("canvas").elementHandle();
  const sameCanvas = () =>
    canvas!.evaluate(
      (element) =>
        element === document.querySelector("[data-glass-scene] canvas"),
    );
  await page.getByRole("link", { name: "김도훈 포트폴리오 홈" }).click();
  await page.waitForURL("**/#top");
  await expect(scene).toHaveAttribute("data-hello-geometry", "glass-mesh");
  await expect(scene).toHaveAttribute("data-scene", "hello");
  expect(await sameCanvas()).toBe(true);
  await page
    .getByRole("link", { name: "LEXUS 프로젝트 보기", exact: true })
    .click();
  await page.waitForURL("**/work/1");
  expect(await sameCanvas()).toBe(true);
  await footer();
  await page
    .getByRole("link", { name: /다음 프로젝트 Kia Worldwide/ })
    .press("Enter");
  await page.waitForURL("**/work/3");
  await footer();
  expect(await sameCanvas()).toBe(true);
  expect(resources.filter((path) => path === GLASS_ASSETS.hello)).toHaveLength(
    1,
  );
  expect(resources.filter((path) => path === GLASS_ASSETS.footer)).toHaveLength(
    1,
  );
  for (const url of [GLASS_ASSETS.hello, GLASS_ASSETS.footer]) {
    const response = await page.request.head(url);
    expect(response.headers()["cache-control"]).toBe(
      "public, max-age=31536000, immutable",
    );
  }
  expect(errors).toEqual([]);
});
