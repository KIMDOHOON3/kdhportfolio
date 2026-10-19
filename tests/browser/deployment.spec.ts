import { expect, test } from "@playwright/test";

test("detail pages reuse the home glass footer through client navigation", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const footer = page.locator("#contact");
  const scene = page.locator("[data-glass-scene]");
  const showFooter = async () => {
    await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
      "data-intro",
      "done",
    );
    const scale = await page.evaluate(() =>
      navigator.maxTouchPoints > 0 ? devicePixelRatio : 1,
    );
    await page.mouse.move(100, 200);
    await page.mouse.wheel(0, 100000 * scale);
    await expect
      .poll(() =>
        footer.evaluate((element) =>
          Math.abs(element.getBoundingClientRect().bottom - innerHeight),
        ),
      )
      .toBeLessThan(1.5);
    await expect(scene).toHaveAttribute("data-ready", "true");
    await expect(scene).toHaveAttribute("data-scene", "thank-you");
    await expect(footer.locator("[data-footer-thanks]")).toHaveAttribute(
      "data-glass-ready",
      "true",
    );
    await expect(footer.locator("[data-footer-thanks]")).toHaveCSS(
      "color",
      "rgba(0, 0, 0, 0)",
    );
    await expect(page.locator("[data-glass-scene] canvas")).toHaveCount(1);
    await expect(footer).toHaveCount(1);
  };
  const footerStyles = () =>
    footer.evaluate((element) => {
      const style = getComputedStyle(element);
      const heading = getComputedStyle(element.querySelector("h2")!);
      return {
        padding: style.padding,
        background: style.background,
        height: Math.round(element.getBoundingClientRect().height),
        fontSize: heading.fontSize,
        lineHeight: heading.lineHeight,
        links: [...element.querySelectorAll("a")].map((a) => ({
          text: a.textContent?.trim(),
          href: a.getAttribute("href"),
          download: a.hasAttribute("download"),
        })),
      };
    });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await showFooter();
  const homeStyles = await footerStyles();
  await page.goto("/work/3");
  await page.evaluate(() => document.fonts.ready);
  await showFooter();
  expect(await footerStyles()).toEqual(homeStyles);
  await page.screenshot({
    path: info.outputPath("detail-shared-footer.png"),
    scale: "css",
  });
  await page.getByRole("link", { name: /다음 프로젝트 Aeppy/ }).press("Enter");
  await page.waitForURL("**/work/5");
  await showFooter();
  expect(await footerStyles()).toEqual(homeStyles);
  await page.getByRole("link", { name: "맨 위로 ↑" }).click();
  await expect
    .poll(() =>
      page.locator("[data-scroll-viewport]").evaluate((e) => e.scrollTop),
    )
    .toBe(0);
  await page.getByRole("link", { name: "김도훈 포트폴리오 홈" }).click();
  await page.waitForURL("**/#top");
  await expect(scene).toHaveAttribute("data-ready", "true");
  await expect(scene).toHaveAttribute("data-scene", "hello");
  await expect(page.locator("[data-glass-scene] canvas")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("deployment revision, illuminated glass and centered thank-you footer", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /THREE|shader|WebGL/i.test(message.text())
    )
      errors.push(message.text());
  });
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  const revision = page.locator('meta[name="portfolio-revision"]');
  if (process.env.EXPECTED_REVISION) {
    await expect(revision).toHaveAttribute(
      "content",
      process.env.EXPECTED_REVISION,
    );
  } else {
    await expect(revision).toHaveAttribute("content", /^(local|[a-f0-9]{40})$/);
  }
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-scene",
    "hello",
  );
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-lighting",
    "studio-environment",
  );
  await expect(page.locator("[data-journey]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.evaluate(() => document.fonts.ready);
  const capture = async (name: string) => {
    await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
      "data-intro",
      "done",
    );
    const path = info.outputPath(`${name}.png`);
    await page.screenshot({ path, scale: "css" });
    await info.attach(name, { path, contentType: "image/png" });
  };
  await capture("deployed-hero-lighting");
  const canRestore = await page
    .locator("[data-glass-scene] canvas")
    .evaluate((canvas) => {
      const gl = (canvas as HTMLCanvasElement).getContext("webgl2");
      const extension = gl?.getExtension("WEBGL_lose_context");
      if (!extension) return false;
      extension.loseContext();
      setTimeout(() => extension.restoreContext(), 750);
      return true;
    });
  expect(canRestore).toBe(true);
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-ready",
    "false",
  );
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await capture("deployed-lighting-restored");
  const { width, height } = page.viewportSize()!;
  await page.mouse.move(width * 0.65, height * 0.5);
  const scale = await page.evaluate(() =>
    navigator.maxTouchPoints > 0 ? devicePixelRatio : 1,
  );
  await page.mouse.wheel(0, 100000 * scale);
  await expect
    .poll(() =>
      page
        .locator("#contact")
        .evaluate((e) =>
          Math.abs(e.getBoundingClientRect().bottom - innerHeight),
        ),
    )
    .toBeLessThan(1.5);
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-scene",
    "thank-you",
  );
  const heading = page.locator("[data-footer-thanks]");
  await expect(heading).toHaveText("THANK YOU");
  await expect(heading).toHaveCSS("font-family", /Pacifico-Footer/);
  await expect(heading).toHaveAttribute("data-glass-ready", "true");
  await expect(heading).toHaveCSS("color", "rgba(0, 0, 0, 0)");
  const rectangles = await page.locator("#contact").evaluate((element) => {
    const rect = (e: Element) => {
      const r = e.getBoundingClientRect();
      return {
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
      };
    };
    return {
      footer: rect(element),
      footerContent: rect(element.lastElementChild!),
      heading: rect(element.querySelector("[data-footer-thanks]")!),
      links: [...element.querySelectorAll("a")].map(rect),
      bodyScroll: scrollY,
      overflow:
        document.querySelector("[data-scroll-viewport]")!.scrollWidth -
        innerWidth,
    };
  });
  expect(
    Math.abs(
      rectangles.heading.left + rectangles.heading.width / 2 - width / 2,
    ),
  ).toBeLessThan(1.5);
  expect(rectangles.footer.height).toBeLessThan(height);
  expect(
    rectangles.footer.bottom - rectangles.footerContent.bottom,
  ).toBeLessThanOrEqual(48);
  expect(rectangles.bodyScroll).toBe(0);
  expect(rectangles.overflow).toBe(0);
  for (const rect of [rectangles.heading, ...rectangles.links]) {
    expect(rect.left).toBeGreaterThanOrEqual(-1);
    expect(rect.right).toBeLessThanOrEqual(width + 1);
    expect(rect.top).toBeGreaterThanOrEqual(-1);
    expect(rect.bottom).toBeLessThanOrEqual(height + 1);
  }
  for (let i = 0; i < rectangles.links.length; i++)
    for (let j = i + 1; j < rectangles.links.length; j++) {
      const a = rectangles.links[i],
        b = rectangles.links[j];
      expect(
        Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
          Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)),
      ).toBe(0);
    }
  await capture("deployed-thank-you-footer");
  await info.attach("deployment-metrics", {
    body: JSON.stringify(
      {
        url: page.url(),
        revision: await revision.getAttribute("content"),
        ...rectangles,
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
  await page.getByRole("link", { name: "맨 위로 ↑" }).click();
  await expect
    .poll(() =>
      page.locator("[data-scroll-viewport]").evaluate((e) => e.scrollTop),
    )
    .toBe(0);
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-scene",
    "hello",
  );
  expect(errors).toEqual([]);
});
