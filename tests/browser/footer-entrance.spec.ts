import { expect, test } from "@playwright/test";
import { GLASS_ASSETS } from "../../src/app/data/glassAssets";

const bottom = async (page: import("@playwright/test").Page) => {
  await page.locator("[data-scroll-viewport]").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
};

test("footer draws completely before its three buttons, without replay on reverse scroll", async ({
  page,
}) => {
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**${GLASS_ASSETS.footer}`, async (route) => {
    await waiting;
    await route.continue();
  });
  const models: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/models/"))
      models.push(new URL(request.url()).pathname);
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /Shader Error|VALIDATE_STATUS/.test(message.text())
    )
      errors.push(message.text());
  });
  await page.goto("/work/5");
  await page.evaluate(() => document.fonts.ready);
  const footer = page.locator("#contact");
  const scene = page.locator("[data-glass-scene]");
  const buttons = footer.locator('[data-entrance-area="푸터 연락처"] > a');
  try {
    await bottom(page);
    await expect.poll(() => models.includes(GLASS_ASSETS.footer)).toBe(true);
    await page.waitForTimeout(400);
    await expect(footer).toHaveAttribute("data-footer-entrance", "waiting");
    for (const button of await buttons.all())
      await expect(button).toHaveAttribute("data-element-state", "pending");
  } finally {
    release();
  }
  await expect(footer).toHaveAttribute("data-footer-entrance", "drawing");
  await expect(page.locator("[data-footer-thanks]")).toHaveAttribute(
    "data-glass-ready",
    "true",
  );
  await expect
    .poll(async () => Number(await scene.getAttribute("data-footer-stroke")))
    .toBeGreaterThan(0.1);
  expect(Number(await scene.getAttribute("data-footer-stroke"))).toBeLessThan(
    1,
  );
  for (const button of await buttons.all())
    await expect(button).toHaveAttribute("data-element-state", "pending");
  await expect(footer).toHaveAttribute("data-footer-entrance", "done");
  await expect(scene).toHaveAttribute("data-footer-stroke", "1.0000");
  for (const button of await buttons.all())
    await expect(button).toHaveAttribute("data-element-state", "done");
  const order = await buttons.evaluateAll((elements) =>
    elements.map((e) => Number((e as HTMLElement).dataset.entranceAt)),
  );
  expect(order[0]).toBeLessThan(order[1]);
  expect(order[1]).toBeLessThan(order[2]);
  await page.locator("[data-scroll-viewport]").evaluate((element) => {
    element.scrollTop -= 800;
  });
  await page.waitForTimeout(100);
  await bottom(page);
  await expect(scene).toHaveAttribute("data-footer-stroke", "1.0000");
  await expect(footer).toHaveAttribute("data-footer-entrance", "done");
  expect(models).toEqual([GLASS_ASSETS.footer]);
  expect(errors).toEqual([]);
});

test("reduced motion shows finished lettering and contact buttons immediately", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/work/5");
  await bottom(page);
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-footer-stroke",
    "1.0000",
  );
  await expect(page.locator("[data-footer-thanks]")).toHaveAttribute(
    "data-glass-ready",
    "true",
  );
  for (const button of await page
    .locator('#contact [data-entrance-area="푸터 연락처"] > a')
    .all())
    await expect(button).toHaveCSS("opacity", "1");
});

test("a failed footer model releases contact buttons and keeps readable text", async ({
  page,
}) => {
  await page.route(`**${GLASS_ASSETS.footer}`, (route) => route.abort());
  await page.goto("/work/5");
  await bottom(page);
  await expect(page.locator("#contact")).toHaveAttribute(
    "data-footer-entrance",
    "done",
  );
  await expect(page.locator("[data-footer-thanks]")).toBeVisible();
  await expect(page.locator("[data-footer-thanks]")).not.toHaveCSS(
    "color",
    "rgba(0, 0, 0, 0)",
  );
  for (const button of await page
    .locator('#contact [data-entrance-area="푸터 연락처"] > a')
    .all())
    await expect(button).toHaveAttribute("data-element-state", "done");
});
