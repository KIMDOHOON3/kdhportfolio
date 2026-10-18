import { expect, test } from "@playwright/test";

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
  await expect(scene).toHaveAttribute("data-hello-geometry", "glass-mesh");
  expect(models.filter((path) => path === "/models/hello.glb")).toHaveLength(1);
  expect(models).not.toContain("/models/thank-you.glb");
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
});
