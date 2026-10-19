import { expect, test } from "@playwright/test";

test("projects start at top 85% without debug markers", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const viewport = page.locator("[data-scroll-viewport]");
  await expect(viewport).toHaveAttribute("data-intro", "done");
  const copy = page.locator("#work h2 [data-copy-reveal]");
  const area = page.locator('[data-entrance-area="프로젝트 제목·필터"]');
  await expect(
    page.locator("[class*='gsap-marker-'], [data-entrance-guide]"),
  ).toHaveCount(0);
  const top = await area.evaluate(
    (element) =>
      element.getBoundingClientRect().top +
      document.querySelector("[data-scroll-viewport]")!.scrollTop,
  );
  await expect(
    page.locator("#work article[data-entrance-trigger-id]"),
  ).toHaveCount(4);
  await expect(area).toHaveAttribute("data-entrance-trigger-id", /^entrance-/);
  const height = await viewport.evaluate((element) => element.clientHeight);
  await viewport.evaluate(
    (element, value) => {
      element.scrollTop = value;
    },
    top - height * 0.9,
  );
  await page.waitForTimeout(200);
  await expect(copy).toHaveAttribute("data-copy-entrance", "pending");
  await page.screenshot({
    path: info.outputPath("trigger-before-85.png"),
    scale: "css",
  });
  await viewport.evaluate(
    (element, value) => {
      element.scrollTop = value;
    },
    top - height * 0.84,
  );
  await expect(copy).toHaveAttribute("data-copy-entrance", "done");
  await viewport.evaluate(
    (element, value) => {
      element.scrollTop = value;
    },
    top - height * 0.95,
  );
  await expect(copy).toHaveAttribute("data-copy-entrance", "done");
  await page
    .getByRole("link", { name: "LEXUS 프로젝트 보기", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/work\/1$/);
  await expect(
    page.locator("[class*='gsap-marker-'], [data-entrance-guide]"),
  ).toHaveCount(0);
});

test("one card trigger releases all its children without additional scroll triggers", async ({
  page,
}) => {
  await page.goto("/");
  const viewport = page.locator("[data-scroll-viewport]");
  await expect(viewport).toHaveAttribute("data-intro", "done");
  const card = page.locator("#work article").first();
  const title = card.locator("h3 [data-copy-reveal]");
  const cover = card.locator("[data-cover-entrance]");
  await expect(card).toHaveAttribute("data-entrance-trigger-id", /^entrance-/);
  const top = await card.evaluate(
    (element) =>
      element.getBoundingClientRect().top +
      document.querySelector("[data-scroll-viewport]")!.scrollTop,
  );
  const height = await viewport.evaluate((element) => element.clientHeight);
  await viewport.evaluate(
    (element, value) => {
      element.scrollTop = value;
    },
    top - height * 0.9,
  );
  await page.waitForTimeout(200);
  await expect(title).toHaveAttribute("data-copy-entrance", "pending");
  await expect(cover).toHaveAttribute("data-cover-entrance", "pending");
  await viewport.evaluate(
    (element, value) => {
      element.scrollTop = value;
    },
    top - height * 0.84,
  );
  expect(
    await cover.evaluate((element) => element.getBoundingClientRect().top),
  ).toBeGreaterThan(height * 0.8);
  await expect(title).toHaveAttribute("data-copy-entrance", "done");
  await expect(cover).toHaveAttribute("data-cover-entrance", "done");
  await expect(card.locator("[data-project-action]")).toHaveAttribute(
    "data-element-state",
    "done",
  );
  await expect(
    card.locator("[data-entrance-after-cover] [data-element-reveal]").last(),
  ).toHaveAttribute("data-element-state", "done");
});

test("project entrances retain their original motion duration with a bounded stagger", async ({
  page,
}) => {
  await page.goto("/");
  const viewport = page.locator("[data-scroll-viewport]");
  await expect(viewport).toHaveAttribute("data-intro", "done");
  const card = page.locator("#work article").first();
  const frame = card.locator("[data-cover-entrance]");
  const image = frame.locator("[data-paper-cover]");
  await expect
    .poll(() =>
      frame
        .locator("img")
        .evaluateAll((images) =>
          images.every((image) => (image as HTMLImageElement).complete),
        ),
    )
    .toBe(true);
  const before = await card.boundingBox();
  const target = await frame.evaluate((element) => {
    const viewport = document.querySelector<HTMLElement>(
      "[data-scroll-viewport]",
    )!;
    return (
      element.getBoundingClientRect().top +
      viewport.scrollTop -
      viewport.clientHeight * 0.35
    );
  });
  await viewport.evaluate((element, top) => {
    element.scrollTop = top;
  }, target);
  await expect(frame).toHaveAttribute("data-cover-entrance", "playing");
  await expect(image).toHaveCSS("animation-duration", "0.55s");
  const delay = await frame.evaluate((element) =>
    parseFloat(element.style.getPropertyValue("--entrance-delay")),
  );
  expect(delay).toBeLessThanOrEqual(1000);
  await expect
    .poll(
      () =>
        image.evaluate((element) => Number(getComputedStyle(element).opacity)),
      { timeout: 2500 },
    )
    .toBeGreaterThan(0.1);
  await expect(frame).toHaveAttribute("data-cover-entrance", "done");
  const after = (await card.boundingBox())!;
  expect(after.width).toBe(before!.width);
  expect(after.height).toBe(before!.height);
  await viewport.evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect(frame).toHaveAttribute("data-cover-entrance", "done");
});
