import { expect, test } from "@playwright/test";

test("drawn interface, aligned filters, real Aeppy cover and journey", async ({
  page,
}, info) => {
  await page.goto("/#about");
  await page.evaluate(() => document.fonts.ready);
  const sketch = page.locator("[data-interface-sketch]");
  await expect(sketch).toHaveAttribute("data-drawn", "true");
  await expect(page.locator('#about img[src*="profile"]')).toHaveCount(0);
  await expect(
    page.getByText("함께할 팀을 찾고 있습니다", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(/한국 시간/)).toHaveCount(0);
  const capture = async (name: string) => {
    const path = info.outputPath(`${name}.png`);
    await page.screenshot({ path, scale: "css" });
    await info.attach(name, { path, contentType: "image/png" });
  };
  await page.waitForTimeout(1600);
  await capture("about-interface-sketch");
  const filters = page.getByRole("group", { name: "프로젝트 필터" });
  await filters.scrollIntoViewIfNeeded();
  const buttons = await filters.getByRole("button").evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      const labelRect = node
        .querySelector("[data-filter-label]")!
        .getBoundingClientRect();
      const countRect = node
        .querySelector("[data-filter-count]")!
        .getBoundingClientRect();
      return {
        top: rect.top,
        height: rect.height,
        labelCenter: labelRect.top + labelRect.height / 2,
        countCenter: countRect.top + countRect.height / 2,
      };
    }),
  );
  expect(
    Math.max(...buttons.map((b) => b.top)) -
      Math.min(...buttons.map((b) => b.top)),
  ).toBeLessThan(1);
  for (const button of buttons) {
    expect(button.height).toBeGreaterThanOrEqual(42);
    expect(Math.abs(button.labelCenter - button.countCenter)).toBeLessThan(3);
  }
  await capture("aligned-project-filters");
  const aeppy = page.locator('a[href="/work/5"]');
  await aeppy.scrollIntoViewIfNeeded();
  const image = aeppy.getByRole("img", { name: /Aeppy/ });
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("src", /aeppy-cover/);
  const resolution = await image.evaluate((img) => ({
    width: img.getBoundingClientRect().width,
    natural: (img as HTMLImageElement).naturalWidth,
  }));
  expect(resolution.natural).toBeGreaterThanOrEqual(
    Math.floor(resolution.width),
  );
  await expect(aeppy.locator('img[src*="hearts"]')).toHaveCount(0);
  await capture("aeppy-real-brand-cover");
  const story = page.locator("[data-scroll-story]");
  const size = page.viewportSize()!;
  const geometry = await story.evaluate((e) => ({
    height: e.getBoundingClientRect().height,
    start:
      e.getBoundingClientRect().top +
      document.querySelector("[data-scroll-viewport]")!.scrollTop,
  }));
  expect(geometry.height).toBeGreaterThan(size.height * 3);
  await page.locator("[data-scroll-viewport]").evaluate(
    (e, top) => {
      e.scrollTop = top;
    },
    geometry.start + size.height * 0.72,
  );
  await expect(story).toHaveAttribute("data-entered", "true");
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-story-dark",
    "false",
  );
  await expect(page.locator("[data-journey-page]")).toBeVisible();
  await expect(page.locator("[data-story-orbit]")).toHaveCount(0);
  await expect(page.locator("[data-journey-chapter]")).toHaveCount(5);
  await capture("centered-skill-groups");
  const overflow = await page
    .locator("[data-scroll-viewport]")
    .evaluate((e) => e.scrollWidth - e.clientWidth);
  expect(overflow).toBe(0);
});
