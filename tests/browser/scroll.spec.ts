import { expect, test, type Page, type TestInfo } from "@playwright/test";

async function ready(page: Page) {
  await page.goto("/");
  await expect(
    page.locator('[data-scroll-story][data-enhanced="true"]'),
  ).toBeAttached();
  await page.evaluate(() => document.fonts.ready);
}

async function startOfStory(page: Page) {
  return page
    .locator("[data-scroll-story]")
    .evaluate(
      (element) =>
        element.getBoundingClientRect().top +
        document.querySelector<HTMLElement>("[data-scroll-viewport]")!
          .scrollTop,
    );
}

async function wheelTo(
  page: Page,
  target: number,
  selector = "[data-scroll-viewport]",
) {
  const top = await page
    .locator(selector)
    .evaluate((element) => element.scrollTop);
  const size = page.viewportSize()!;
  await page.mouse.move(size.width * 0.7, size.height * 0.5);
  const inputScale = await page.evaluate(() =>
    navigator.maxTouchPoints > 0 ? devicePixelRatio : 1,
  );
  await page.mouse.wheel(0, (target - top) * inputScale);
  await expect
    .poll(async () =>
      Math.abs(
        (await page
          .locator(selector)
          .evaluate((element) => element.scrollTop)) - target,
      ),
    )
    .toBeLessThanOrEqual(4);
}

async function capture(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, scale: "css" });
  await info.attach(name, { path, contentType: "image/png" });
}

test("wheel: entry, four stages, reverse, release and collision checks", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  const height = page.viewportSize()!.height;
  const start = await startOfStory(page);
  await capture(page, info, "hero");
  for (const offset of [
    -0.25, -0.1, 0, 0.5, 1.98, 2.02, 3.98, 4.02, 5.98, 6.02, 7, 7.5,
  ]) {
    const target = Math.round(start + offset * height);
    await wheelTo(page, target);
    const stage = Math.min(3, Math.floor(Math.max(0, offset) / 2));
    await expect(page.locator("[data-scroll-story]")).toHaveAttribute(
      "data-stage",
      String(stage),
    );
    await expect(page.locator("[data-story-panel]:not([hidden])")).toHaveCount(
      1,
    );
    if (offset === -0.25)
      await expect(
        page.locator("[data-story-panel='0'] h2 span span").first(),
      ).toHaveCSS("opacity", "0");
    if (offset >= -0.1 && stage !== 2)
      await expect(
        page.locator(`[data-story-panel='${stage}'] h2 span span`).last(),
      ).toHaveCSS("opacity", "1");
    if (offset === 0.5 || offset === 4.02)
      await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
        "data-story-dark",
        "true",
      );
    if (offset === 7)
      await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
        "data-story-dark",
        "false",
      );
    const metric = await page.evaluate(() => {
      const viewport = document.querySelector<HTMLElement>(
        "[data-scroll-viewport]",
      )!;
      const pin = document
        .querySelector("[data-story-pinned]")!
        .getBoundingClientRect();
      const regions = ["home", "about", "work"].map((id) =>
        document.getElementById(id)!.getBoundingClientRect(),
      );
      regions.push(
        document.querySelector("[data-scroll-story]")!.getBoundingClientRect(),
        document.querySelector("footer")!.getBoundingClientRect(),
      );
      return {
        body: window.scrollY,
        overflow: viewport.scrollWidth - viewport.clientWidth,
        pin: pin.top,
        height: pin.height,
        storyBottom: document
          .querySelector("[data-scroll-story]")!
          .getBoundingClientRect().bottom,
        collisions: regions
          .slice(1)
          .filter((rect, i) => rect.top < regions[i].bottom - 1).length,
      };
    });
    expect(metric.body).toBe(0);
    expect(metric.overflow).toBe(0);
    expect(metric.collisions).toBe(0);
    expect(metric.height).toBe(height);
    if (offset >= 0.5 && offset <= 7)
      expect(Math.abs(metric.pin)).toBeLessThan(1.5);
    if (offset === 7.5)
      expect(Math.abs(metric.pin - (metric.storyBottom - height))).toBeLessThan(
        1.5,
      );
    if ([0, 0.5, 2.02, 4.02, 6.02, 7.5].includes(offset))
      await capture(page, info, `story-${offset}`);
  }
  for (const offset of [5, 3, 0.5]) {
    await wheelTo(page, Math.round(start + offset * height));
    await expect(page.locator("[data-scroll-story]")).toHaveAttribute(
      "data-stage",
      String(Math.floor(offset / 2)),
    );
  }
  await wheelTo(page, Math.round(start + height * 4.5));
  const blocks = await page
    .locator("[data-principle], [data-story-panel='2'] a")
    .evaluateAll((elements) =>
      elements.map((element) => {
        const r = element.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
      }),
    );
  for (const block of blocks) {
    expect(block.top).toBeGreaterThan(65);
    expect(block.bottom).toBeLessThan(height - 35);
    expect(block.left).toBeGreaterThanOrEqual(0);
    expect(block.right).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  for (let i = 0; i < blocks.length; i++)
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i],
        b = blocks[j];
      expect(
        Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
          Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)),
      ).toBe(0);
    }
  expect(errors).toEqual([]);
});

test("filters, anchors, mobile menu and detail return", async ({ page }) => {
  await ready(page);
  for (const [name, count] of [
    ["실무", 3],
    ["개인", 2],
    ["전체", 5],
  ] as const) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await expect(page.locator("#work a[href^='/work/']")).toHaveCount(count);
  }
  const menu = page.getByRole("button", { name: "메뉴 열기", exact: true });
  if (await menu.isVisible()) {
    await menu.click();
    await expect(page.getByRole("navigation")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await menu.click();
  }
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "소개", exact: true })
    .click();
  await expect
    .poll(() =>
      page
        .locator("#about")
        .evaluate((e) => Math.round(e.getBoundingClientRect().top)),
    )
    .toBeLessThan(100);
  await page
    .getByRole("link", { name: "LEXUS 리뉴얼 프로젝트 보기", exact: true })
    .click();
  await page.waitForURL("**/work/1");
  await expect(
    page.getByRole("heading", { name: "LEXUS", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.locator("[data-scroll-viewport]").evaluate((e) => e.scrollTop),
    )
    .toBe(0);
  await page
    .getByRole("link", { name: "← 프로젝트 목록으로", exact: true })
    .click();
  await page.waitForURL("**/#work");
  await expect
    .poll(() =>
      page
        .locator("#work")
        .evaluate((e) => Math.abs(e.getBoundingClientRect().top)),
    )
    .toBeLessThan(100);
});

test("reduced motion and touch scroll", async ({ page, context, isMobile }) => {
  await ready(page);
  if (isMobile) {
    const session = await context.newCDPSession(page);
    const { width, height } = page.viewportSize()!;
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: width / 2, y: height * 0.8 }],
    });
    for (let i = 1; i <= 8; i++)
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: width / 2, y: height * (0.8 - i * 0.06) }],
      });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect
      .poll(() =>
        page.locator("[data-scroll-viewport]").evaluate((e) => e.scrollTop),
      )
      .toBeGreaterThan(20);
    await session.detach();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-scroll-story]")).toHaveAttribute(
    "data-enhanced",
    "false",
  );
  await expect(page.locator("[data-story-panel]:not([hidden])")).toHaveCount(4);
  await expect(page.locator("[data-story-pinned]")).toHaveCSS(
    "position",
    "relative",
  );
  await expect(page.locator("[data-story-backdrop]")).toHaveCSS(
    "display",
    "none",
  );
});
