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
  ).toHaveCount(0);
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
