import { expect, test } from "@playwright/test";

test("copy and image entrances keep layout stable and do not replay after scrolling or filtering", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    const plays: string[] = [];
    (window as typeof window & { coverPlays: string[] }).coverPlays = plays;
    new MutationObserver((records) => {
      for (const record of records) {
        const target = record.target as HTMLElement;
        if (target.dataset.coverEntrance === "playing")
          plays.push(target.dataset.coverProject!);
      }
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-cover-entrance"],
    });
  });
  await page.goto("/");
  const viewport = page.locator("[data-scroll-viewport]");
  await expect(viewport).toHaveAttribute("data-intro", "done");
  const first = page.locator('[data-cover-project="1"]');
  const second = page.locator('[data-cover-project="3"]');
  const panel = first.locator("[data-paper-cover]");
  const surface = first.locator("[data-cover-surface]");
  await expect(first).toHaveAttribute("data-cover-entrance", "pending");
  await expect(panel).toHaveCSS("clip-path", /inset\(0px 0px 100%/);
  await expect(panel).toHaveCSS("filter", "none");
  await expect(panel).toHaveCSS("opacity", "0");
  const geometry = () =>
    page.locator("#work article").evaluateAll((elements) => {
      const top = document.querySelector("[data-scroll-viewport]")!.scrollTop;
      return elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          top: rect.top + top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };
      });
    });
  const before = await geometry();
  const titleFont = await page
    .locator("#work h3")
    .first()
    .evaluate((heading) => ({
      heading: getComputedStyle(heading).fontSize,
      text: getComputedStyle(
        heading.querySelector("[data-copy-reveal] > span")!,
      ).fontSize,
    }));
  expect(titleFont.text).toBe(titleFont.heading);
  await page
    .getByRole("link", { name: "프로젝트 살펴보기", exact: true })
    .click();
  await expect(first).toHaveAttribute("data-cover-entrance", "playing");
  await first.evaluate((element) => {
    for (const animation of element.getAnimations({ subtree: true })) {
      animation.pause();
      animation.currentTime = Number(animation.effect!.getTiming().delay) + 250;
    }
  });
  await expect(panel).toHaveCSS("transform", "none");
  await expect(surface).toHaveCSS("transform", "none");
  await expect(panel).not.toHaveCSS("translate", "none");
  const clip = await panel.evaluate(
    (element) => getComputedStyle(element).clipPath,
  );
  expect(clip).not.toBe("none");
  expect(clip).not.toContain("100%");
  await expect(page.locator("[data-cover-reflection]")).toHaveCount(0);
  await expect(
    page
      .locator("#work article")
      .first()
      .getByRole("heading", { name: "LEXUS", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("project-entry.png"),
    scale: "css",
  });
  await first.evaluate((element) =>
    element
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.play()),
  );
  await expect(first).toHaveAttribute("data-cover-entrance", "done");
  await expect(panel).toHaveCSS("clip-path", "none");
  await expect(surface).toHaveCSS("transform", "none");
  await expect(surface).toHaveCSS("will-change", "auto");
  await expect(viewport).not.toHaveClass(/lenis-scrolling/);
  if (info.project.use.isMobile) await second.scrollIntoViewIfNeeded();
  await expect(second).toHaveAttribute("data-cover-entrance", "done");
  expect(await geometry()).toEqual(before);
  await viewport.evaluate((element) => {
    element.scrollTop = 0;
  });
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveAttribute("data-cover-entrance", "done");
  const filters = page.getByRole("group", { name: "프로젝트 필터" });
  await filters.getByRole("button", { name: "개인 02", exact: true }).click();
  await filters.getByRole("button", { name: "전체 04", exact: true }).click();
  await expect(first).toHaveAttribute("data-cover-entrance", "done");
  await expect(
    page
      .locator("#work article")
      .first()
      .locator("[data-copy-entrance]")
      .first(),
  ).toHaveAttribute("data-copy-entrance", "done");
  expect(
    await page.evaluate(() =>
      (window as typeof window & { coverPlays: string[] }).coverPlays.filter(
        (id) => id === "1",
      ),
    ),
  ).toHaveLength(1);
  await first.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("project-settled.png"),
    scale: "css",
  });
});

test("reduced motion and keyboard focus reveal all text and images immediately", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const frame of await page.locator("[data-cover-entrance]").all()) {
    await expect(frame).toHaveAttribute("data-cover-entrance", "done");
    await expect(frame.locator("[data-paper-cover]")).toHaveCSS(
      "clip-path",
      "none",
    );
    await expect(frame.locator("[data-cover-surface]")).toHaveCSS(
      "transform",
      "none",
    );
  }
  for (const copy of await page.locator("[data-copy-reveal]").all()) {
    await expect(copy).toHaveAttribute("data-copy-entrance", "done");
    await expect(copy.locator(":scope > span").first()).toHaveCSS(
      "opacity",
      "1",
    );
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page
    .getByRole("link", { name: "Aeppy 프로젝트 보기", exact: true })
    .focus();
  await expect(page.locator('[data-cover-project="5"]')).toHaveAttribute(
    "data-cover-entrance",
    "done",
  );
  for (const copy of await page
    .locator("#work article")
    .nth(2)
    .locator("[data-copy-reveal]")
    .all())
    await expect(copy).toHaveAttribute("data-copy-entrance", "done");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.locator(
      '[data-copy-entrance="pending"], [data-cover-entrance="pending"]',
    ),
  ).toHaveCount(0);
});

test("no JavaScript keeps content readable and detail covers keep their normal appearance", async ({
  browser,
  page,
}, info) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: info.project.use.viewport,
  });
  const staticPage = await context.newPage();
  await staticPage.goto(process.env.PORTFOLIO_URL ?? "http://localhost:3010");
  await expect(staticPage.locator("[data-cover-entrance]")).toHaveCount(4);
  for (const frame of await staticPage.locator("[data-cover-entrance]").all()) {
    await expect(frame.locator("[data-paper-cover]")).toHaveCSS(
      "clip-path",
      "none",
    );
    await expect(frame.locator("[data-cover-surface]")).toHaveCSS(
      "transform",
      "none",
    );
  }
  for (const copy of await staticPage.locator("[data-copy-reveal]").all())
    await expect(copy.locator(":scope > span").first()).toHaveCSS(
      "opacity",
      "1",
    );
  await context.close();
  await page.goto("/work/1");
  await expect(
    page.locator(
      "main [data-cover-entrance], main [data-cover-reflection], main [data-copy-reveal]",
    ),
  ).toHaveCount(0);
});

test("copy moves as one reading unit and wraps naturally during resize", async ({
  page,
}, info) => {
  await page.goto("/#work");
  const copy = page.locator("#work article h3 [data-copy-reveal]").first();
  await expect(copy).toHaveAttribute("data-copy-entrance", "playing");
  await copy.evaluate((element) =>
    element.getAnimations().forEach((animation) => {
      animation.pause();
      animation.currentTime = Number(animation.effect!.getTiming().delay) + 250;
    }),
  );
  await expect(copy.locator(":scope > span")).toHaveCount(1);
  await expect(copy.locator('[aria-hidden="true"]')).toHaveCount(0);
  await expect(copy).toHaveCSS("filter", "none");
  const size = page.viewportSize()!;
  await page.setViewportSize({ width: size.width - 30, height: size.height });
  const overflow = await copy.evaluate(
    (element) => element.scrollWidth - element.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({
    path: info.outputPath("copy-group.png"),
    scale: "css",
  });
  await copy.evaluate((element) =>
    element.getAnimations().forEach((animation) => animation.play()),
  );
  await expect(copy).toHaveAttribute("data-copy-entrance", "done");
  await expect(copy).toHaveCSS("translate", "none");
});
