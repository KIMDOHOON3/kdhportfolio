import { expect, test } from "@playwright/test";

test("skills and existing career summary stay readable without extra scrolling", async ({
  page,
  isMobile,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const story = page.locator("[data-scroll-story]");
  await expect(story).toHaveAttribute("data-enhanced", "true");
  const height = page.viewportSize()!.height;
  const viewport = page.locator("[data-scroll-viewport]");
  const start = await story.evaluate(
    (element) =>
      element.getBoundingClientRect().top +
      document.querySelector("[data-scroll-viewport]")!.scrollTop,
  );
  await viewport.evaluate(
    (element, top) => {
      element.scrollTop = top;
    },
    start + height * 1.9,
  );
  await expect(story).toHaveAttribute("data-stage", "2");
  const panel = page.locator('[data-story-panel="2"]');
  const skills = panel.getByRole("tab", { name: "기술 활용" });
  const career = panel.getByRole("tab", { name: "이력 요약" });
  await expect(skills).toHaveAttribute("aria-selected", "true");
  await expect(panel.getByRole("tabpanel")).toHaveCount(1);
  await expect(panel.getByRole("tabpanel").locator("article")).toHaveCount(3);
  await expect(panel.getByText(/예약·폼의 상태/)).toBeVisible();
  const capture = async (name: string) => {
    const path = info.outputPath(`${name}.png`);
    await page.screenshot({ path, scale: "css" });
    await info.attach(name, { path, contentType: "image/png" });
  };
  const bounds = async () => {
    const boxes = await panel
      .locator(
        'h2, [role="tablist"], [role="tabpanel"]:not([hidden]) article, a',
      )
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect();
          return {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
          };
        }),
      );
    for (const box of boxes) {
      expect(box.top).toBeGreaterThan(64);
      expect(box.bottom).toBeLessThan(height - 25);
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(page.viewportSize()!.width);
    }
    return boxes[0].top;
  };
  await page.waitForTimeout(800);
  const skillsTop = await bounds();
  await capture("technical-explanations");
  const scrollTop = await viewport.evaluate((element) => element.scrollTop);
  if (isMobile) await career.tap();
  else await career.click();
  await expect(career).toHaveAttribute("aria-selected", "true");
  await expect(panel.getByRole("tabpanel").locator("article")).toHaveCount(4);
  await expect(panel.getByText("언제나 디자인", { exact: true })).toBeVisible();
  await expect(
    panel.getByText("2022.07 — 2023.10", { exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByText("코드잇 스프린트", { exact: true }),
  ).toBeVisible();
  expect(Math.abs((await bounds()) - skillsTop)).toBeLessThan(3);
  expect(
    Math.abs(
      (await viewport.evaluate((element) => element.scrollTop)) - scrollTop,
    ),
  ).toBeLessThan(3);
  await capture("existing-career-summary");
  await career.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(skills).toBeFocused();
  await expect(skills).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(career).toBeFocused();
  await expect(career).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Tab");
  await expect(panel.getByRole("tabpanel")).toBeFocused();
  const resume = panel.getByRole("link", { name: "이력서 내려받기" });
  await expect(resume).toHaveAttribute("download", "");
  const response = await page.request.get((await resume.getAttribute("href"))!);
  expect(response.ok()).toBe(true);
  expect(
    await viewport.evaluate(
      (element) => element.scrollWidth - element.clientWidth,
    ),
  ).toBe(0);
  expect(errors).toEqual([]);
});
