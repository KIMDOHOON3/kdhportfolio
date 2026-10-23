import { expect, test } from "@playwright/test";
import { GALLERY_ASSETS } from "../../src/app/data/staticAssets";

test("the same curved surface unfolds into the detail hero and returns to the gallery", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("Shader Error"))
      errors.push(message.text());
  });
  await page.goto("/#work");
  const host = page.locator("[data-gallery-canvas]");
  await expect(host).toHaveAttribute("data-ready", "true");
  await page
    .getByRole("button", { name: "갤러리 자동 회전 일시 정지" })
    .click();
  const canvas = await host.locator("canvas").elementHandle();
  await page
    .getByRole("link", { name: "LEXUS 프로젝트 보기", exact: true })
    .click();
  const transition = page.locator("[data-route-transition]");
  await expect(transition).toHaveAttribute("data-gallery-flight", "true");
  expect(
    await canvas!.evaluate((element) =>
      element.parentElement?.hasAttribute("data-route-transition"),
    ),
  ).toBe(true);
  await expect(transition).toHaveAttribute("data-phase", "enter");
  await expect
    .poll(() => canvas!.getAttribute("data-flight-progress"))
    .toMatch(/^0\.[3-9]/);
  await page.screenshot({
    path: info.outputPath("curved-surface-flight.png"),
    scale: "css",
  });
  await expect(transition).toHaveAttribute("data-active", "false");
  const hero = page.locator("[data-project-transition-cover]");
  await expect(hero).toHaveCSS("visibility", "visible");
  await expect(hero.locator("img")).toHaveAttribute("src", GALLERY_ASSETS[1]);
  const before = await hero.boundingBox();
  await page.waitForTimeout(100);
  expect(await hero.boundingBox()).toEqual(before);
  await page.goBack();
  await expect(transition).toHaveAttribute("data-gallery-flight", "true");
  // While the shared canvas is still in the overlay, its returned host must
  // suppress the flat fallback. Otherwise two versions overlap during return.
  await expect(host).toHaveAttribute("data-ready", "true");
  await expect(
    page.locator("[data-project-gallery] [class*='fallbackArtwork']"),
  ).toHaveCSS("visibility", "hidden");
  await expect(transition).toHaveAttribute("data-active", "false");
  await expect(host).toHaveAttribute("data-ready", "true");
  expect(
    await canvas!.evaluate(
      (element) =>
        element === document.querySelector("[data-gallery-canvas] canvas"),
    ),
  ).toBe(true);
  await expect(page.locator("[data-scroll-viewport]")).not.toHaveAttribute(
    "data-route-lock",
    "true",
  );
  expect(errors).toEqual([]);
});

test("the gallery stops GPU drawing offscreen and reuses its canvas on return", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const counts = { draws: 0 };
    (window as Window & { galleryDraws?: typeof counts }).galleryDraws = counts;
    const original = WebGL2RenderingContext.prototype.drawElements;
    WebGL2RenderingContext.prototype.drawElements = function (
      ...args: Parameters<typeof original>
    ) {
      if (
        (this.canvas as HTMLCanvasElement).hasAttribute(
          "data-curved-gallery-canvas",
        )
      )
        counts.draws++;
      return original.apply(this, args);
    };
  });
  await page.goto("/#work");
  const host = page.locator("[data-gallery-canvas]");
  await expect(host).toHaveAttribute("data-ready", "true");
  const draws = () =>
    page.evaluate(
      () =>
        (window as Window & { galleryDraws?: { draws: number } }).galleryDraws!
          .draws,
    );
  const started = await draws();
  await expect.poll(draws).toBeGreaterThan(started);
  const canvas = await host.locator("canvas").elementHandle();
  await page.locator("[data-scroll-viewport]").evaluate((element) => {
    element.scrollTop =
      document.querySelector("#about")!.getBoundingClientRect().top +
      element.scrollTop +
      400;
  });
  await page.waitForTimeout(250);
  const stopped = await draws();
  await page.waitForTimeout(250);
  expect(await draws()).toBe(stopped);
  await host.scrollIntoViewIfNeeded();
  await expect.poll(draws).toBeGreaterThan(stopped);
  expect(
    await canvas!.evaluate(
      (element) =>
        element === document.querySelector("[data-gallery-canvas] canvas"),
    ),
  ).toBe(true);
});
