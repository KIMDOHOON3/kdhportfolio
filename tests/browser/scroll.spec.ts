import { expect, test, type Page, type TestInfo } from "@playwright/test";

async function ready(page: Page) {
  await page.goto("/");
  await expect(page.locator("[data-journey]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
}
async function wheelTo(page: Page, target: number) {
  const viewport = page.locator("[data-scroll-viewport]");
  const scale = await page.evaluate(() =>
    navigator.maxTouchPoints > 0 ? devicePixelRatio : 1,
  );
  const size = page.viewportSize()!;
  await page.mouse.move(size.width * 0.8, size.height * 0.5);
  await page.mouse.wheel(
    0,
    (target - (await viewport.evaluate((e) => e.scrollTop))) * scale,
  );
  let corrections = 0;
  await expect
    .poll(async () => {
      let current = await viewport.evaluate((e) => e.scrollTop);
      if (Math.abs(current - target) > 4 && corrections < 3) {
        await page.waitForTimeout(750);
        current = await viewport.evaluate((e) => e.scrollTop);
        if (Math.abs(current - target) > 4) {
          await page.mouse.wheel(0, (target - current) * scale);
          corrections++;
        }
      }
      return Math.abs((await viewport.evaluate((e) => e.scrollTop)) - target);
    })
    .toBeLessThanOrEqual(4);
}
async function capture(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, scale: "css" });
  await info.attach(name, { path, contentType: "image/png" });
}

test("browser entry grows from the illustration, reverses and releases into the timeline", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  const story = page.locator("[data-journey]");
  const portal = page.locator("[data-browser-entry]");
  const start = await story.evaluate(
    (e) =>
      e.getBoundingClientRect().top +
      document.querySelector("[data-scroll-viewport]")!.scrollTop,
  );
  const { height, width } = page.viewportSize()!;
  let previousWidth = 0;
  for (const [name, offset] of [
    ["early", -0.55],
    ["middle", 0.025],
    ["late", 0.55],
  ] as const) {
    await wheelTo(page, Math.round(start + height * offset));
    await expect(portal).toBeVisible();
    await expect(story).toHaveAttribute("data-phase", "entering");
    const bounds = (await portal.boundingBox())!;
    expect(bounds.width).toBeGreaterThan(previousWidth);
    expect(bounds.width).toBeLessThanOrEqual(width + 3);
    previousWidth = bounds.width;
    await expect(page.locator("[data-journey-page]")).toHaveCSS("opacity", "0");
    await capture(page, info, `browser-${name}`);
  }
  await wheelTo(page, Math.round(start + height * 0.72));
  await expect(portal).toBeHidden();
  await expect(story).toHaveAttribute("data-entered", "true");
  await expect(page.locator("[data-journey-page]")).toBeVisible();
  await expect(page.locator("[data-story-backdrop]")).toHaveCount(0);
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-story-dark",
    "false",
  );
  await capture(page, info, "browser-inside");
  await wheelTo(page, Math.round(start + height * 0.025));
  await expect(portal).toBeVisible();
  await expect(story).toHaveAttribute("data-phase", "entering");
  await wheelTo(page, Math.round(start - height * 2));
  await expect(portal).toBeHidden();
  await expect(page.locator("[data-interface-sketch]")).toHaveCSS(
    "opacity",
    "1",
  );
  await page
    .getByRole("link", { name: "언제든 연락주세요!" })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("link", { name: "언제든 연락주세요!" }),
  ).toHaveAttribute("href", "mailto:kingyska@nate.com");
  const footerDestination = await page
    .locator("#contact")
    .evaluate((element) => {
      const viewport = document.querySelector("[data-scroll-viewport]")!;
      return Math.min(
        element.getBoundingClientRect().top + viewport.scrollTop,
        viewport.scrollHeight - viewport.clientHeight,
      );
    });
  await wheelTo(page, Math.round(footerDestination));
  await expect(page.locator("#contact")).toBeInViewport();
  await expect(portal).toBeHidden();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(
    await page
      .locator("[data-scroll-viewport]")
      .evaluate((e) => e.scrollWidth - e.clientWidth),
  ).toBe(0);
  expect(errors).toEqual([]);
});

test("timeline branches draw into the contact background and reverse with scrolling", async ({
  page,
}, info) => {
  await ready(page);
  const outro = page.locator("[data-journey-ending]");
  const start = await outro.evaluate(
    (e) =>
      e.getBoundingClientRect().top +
      document.querySelector("[data-scroll-viewport]")!.scrollTop,
  );
  const height = page.viewportSize()!.height;
  const path = page.locator("[data-connection-path]").first();
  await wheelTo(page, Math.round(start - height * 0.95));
  const first = Number(await outro.getAttribute("data-progress"));
  expect(first).toBe(0);
  const line = page.locator("[data-journey-line]");
  expect(
    await line.evaluate((e) =>
      Number(e.style.getPropertyValue("--line-progress")),
    ),
  ).toBeLessThan(1);
  await expect(page.locator("[data-journey-connection]")).toHaveCSS(
    "visibility",
    "hidden",
  );
  const firstOffset = await path.evaluate((e) =>
    parseFloat(getComputedStyle(e).strokeDashoffset),
  );
  await wheelTo(page, Math.round(start - height * 0.12));
  await expect
    .poll(async () => Number(await outro.getAttribute("data-progress")))
    .toBeGreaterThan(first);
  const nextOffset = await path.evaluate((e) =>
    parseFloat(getComputedStyle(e).strokeDashoffset),
  );
  expect(nextOffset).toBeLessThan(firstOffset);
  await expect
    .poll(() =>
      line.evaluate((e) => Number(e.style.getPropertyValue("--line-progress"))),
    )
    .toBe(1);
  await expect(page.locator("[data-journey-connection]")).toHaveCSS(
    "visibility",
    "visible",
  );
  const connection = await page.evaluate(() => {
    const area = document
      .querySelector("[data-journey-ending]")!
      .getBoundingClientRect();
    const line = document
      .querySelector("[data-journey-line]")!
      .getBoundingClientRect();
    const start = document
      .querySelector<SVGPathElement>("[data-connection-path]")!
      .getPointAtLength(0);
    return {
      horizontal: Math.abs(area.left + start.x - line.left),
      vertical: Math.abs(area.top - line.bottom),
    };
  });
  expect(connection.horizontal).toBeLessThan(1);
  expect(connection.vertical).toBeLessThan(1);
  await expect(page.locator("[data-connection-path]")).toHaveCount(7);
  await expect(outro).toContainText("함께 일하고 싶은 프론트엔드 개발자");
  await capture(page, info, "timeline-branches");
  await wheelTo(page, Math.round(start - height * 0.95));
  await expect
    .poll(() =>
      path.evaluate((e) => parseFloat(getComputedStyle(e).strokeDashoffset)),
    )
    .toBeGreaterThan(nextOffset);
  await expect(page.locator("[data-journey-connection]")).toHaveCSS(
    "visibility",
    "hidden",
  );
  await wheelTo(page, Math.round(start + height * 0.15));
  await capture(page, info, "timeline-to-thank-you");
  expect(
    await page
      .locator("[data-scroll-viewport]")
      .evaluate((e) => e.scrollWidth - e.clientWidth),
  ).toBe(0);
});

test("filters, menu navigation and detail return remain usable", async ({
  page,
}) => {
  await ready(page);
  const resume = page
    .locator("[data-journey-page]")
    .getByRole("link", { name: "이력서 내려받기" });
  await resume.focus();
  await expect(resume).toBeFocused();
  await expect(page.locator("[data-journey]")).toHaveAttribute(
    "data-entered",
    "true",
  );
  await page.getByRole("link", { name: "김도훈 포트폴리오 홈" }).click();
  for (const [name, count] of [
    ["실무", 2],
    ["개인", 2],
    ["전체", 4],
  ] as const) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await expect(page.locator("#work a[href^='/work/']")).toHaveCount(count);
  }
  const menu = page.getByRole("button", { name: "메뉴 열기", exact: true });
  if (await menu.isVisible()) {
    await menu.click();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await menu.click();
  }
  await page
    .getByRole("navigation", { name: "메인 메뉴" })
    .getByRole("link", { name: "ABOUT", exact: true })
    .click();
  await expect
    .poll(() =>
      page
        .locator("#about")
        .evaluate((e) => Math.abs(e.getBoundingClientRect().top)),
    )
    .toBeLessThan(100);
  await page
    .getByRole("link", { name: "LEXUS 프로젝트 보기", exact: true })
    .click();
  await page.waitForURL("**/work/1");
  await expect(
    page.getByRole("heading", { name: "LEXUS", exact: true }),
  ).toBeVisible();
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

test("touch and reduced motion retain all career content without zoom", async ({
  page,
  context,
  isMobile,
}) => {
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
  await expect(page.locator("[data-journey]")).toHaveAttribute(
    "data-enhanced",
    "false",
  );
  await expect(page.locator("[data-browser-entry]")).toBeHidden();
  await expect(page.locator("[data-journey-chapter]")).toHaveCount(5);
  await expect(
    page.locator("[data-journey-page] [data-skills-track]"),
  ).toHaveCSS("animation-name", "none");
  await page.locator("#journey-now").scrollIntoViewIfNeeded();
  await expect(
    page.locator("#journey-now").getByRole("heading"),
  ).toBeInViewport();
  await page.goto("/#journey-2022");
  const directChapter = page.locator("#journey-2022");
  await expect
    .poll(() =>
      directChapter.evaluate((e) =>
        Math.abs(
          e.getBoundingClientRect().top -
            parseFloat(getComputedStyle(e).scrollMarginTop),
        ),
      ),
    )
    .toBeLessThan(3);
});

test("career content is readable before JavaScript enhancement", async ({
  browser,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "SSR content does not vary by device",
  );
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  await page.goto(process.env.PORTFOLIO_URL ?? "http://localhost:3010");
  await expect(page.locator("[data-journey]")).toHaveAttribute(
    "data-enhanced",
    "false",
  );
  await expect(page.locator("[data-browser-entry]")).toBeHidden();
  await page.locator("#journey-2022").scrollIntoViewIfNeeded();
  await expect(
    page.locator("#journey-2022").getByRole("heading"),
  ).toBeInViewport();
  await context.close();
});
