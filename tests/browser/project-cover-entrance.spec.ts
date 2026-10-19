import { expect, test } from "@playwright/test";

test("sharp project covers settle into place and reflect light only once", async ({
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
  const reflection = first.locator("[data-cover-reflection]");
  await expect(first).toHaveAttribute("data-cover-entrance", "pending");
  await expect(panel).toHaveCSS("filter", "none");
  await expect(panel).toHaveCSS("opacity", "1");
  const cards = page.locator("#work article");
  const geometry = () =>
    cards.evaluateAll((elements) => {
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
  await page
    .getByRole("link", { name: "프로젝트 살펴보기", exact: true })
    .click();
  await expect(first).toHaveAttribute("data-cover-entrance", "playing");
  await expect(panel).not.toHaveCSS("transform", "none");
  for (const text of [
    page.locator("#work h2"),
    page.locator("#work article").first().locator("h3"),
    page.locator("#work article").first().locator("[id^='project-tasks-']"),
  ]) {
    await expect(text).toHaveCSS("opacity", "1");
    await expect(text).toHaveCSS("filter", "none");
  }
  await expect(reflection).toHaveCSS("animation-iteration-count", "1");
  await expect
    .poll(() =>
      reflection.evaluate((e) => parseFloat(getComputedStyle(e).opacity)),
    )
    .toBeGreaterThan(0);
  expect(
    await reflection.evaluate((e) => parseFloat(getComputedStyle(e).opacity)),
  ).toBeLessThanOrEqual(0.45);
  await page.screenshot({
    path: info.outputPath("cover-light-pass.png"),
    scale: "css",
  });
  await expect(first).toHaveAttribute("data-cover-entrance", "done");
  await expect(panel).toHaveCSS("transform", "none");
  await expect(panel).toHaveCSS("will-change", "auto");
  await expect(reflection).toHaveCSS("animation-name", "none");
  await expect(reflection).toHaveCSS("opacity", "0");
  await expect(viewport).not.toHaveClass(/lenis-scrolling/);
  if (info.project.use.isMobile) await second.scrollIntoViewIfNeeded();
  await expect(second).toHaveAttribute("data-cover-entrance", "done");
  expect(await geometry()).toEqual(before);
  await viewport.evaluate((e) => {
    e.scrollTop = 0;
  });
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveAttribute("data-cover-entrance", "done");
  const filters = page.getByRole("group", { name: "프로젝트 필터" });
  await filters.getByRole("button", { name: "개인 02", exact: true }).click();
  await filters.getByRole("button", { name: "전체 04", exact: true }).click();
  await expect(first).toHaveAttribute("data-cover-entrance", "done");
  expect(
    await page.evaluate(() =>
      (window as typeof window & { coverPlays: string[] }).coverPlays.filter(
        (id) => id === "1",
      ),
    ),
  ).toHaveLength(1);
  await expect(page.locator('[id^="fade-content-mask-"]')).toHaveCount(0);
  await expect(page.locator("[data-reveal-effect]")).toHaveCount(0);
  await first.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("cover-settled.png"),
    scale: "css",
  });
});

test("keyboard focus and reduced motion keep covers still and clear", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const frame of await page.locator("[data-cover-entrance]").all()) {
    await expect(frame).toHaveAttribute("data-cover-entrance", "done");
    await expect(frame.locator("[data-paper-cover]")).toHaveCSS(
      "transform",
      "none",
    );
    await expect(frame.locator("[data-cover-reflection]")).toHaveCSS(
      "animation-name",
      "none",
    );
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page
    .getByRole("link", { name: "Aeppy 프로젝트 보기", exact: true })
    .focus();
  const aeppy = page.locator('[data-cover-project="5"]');
  await expect(aeppy).toHaveAttribute("data-cover-entrance", "done");
  await expect(aeppy.locator("[data-paper-cover]")).toHaveCSS("filter", "none");
  await expect(aeppy.locator("[data-paper-cover]")).toHaveCSS(
    "transform",
    "none",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const frame of await page.locator("[data-cover-entrance]").all())
    await expect(frame).toHaveAttribute("data-cover-entrance", "done");
});

test("static covers remain readable without JavaScript and details keep their normal cover", async ({
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
      "transform",
      "none",
    );
    await expect(frame.locator("[data-cover-reflection]")).toHaveCSS(
      "opacity",
      "0",
    );
  }
  await context.close();
  await page.goto("/work/1");
  await expect(
    page.locator("[data-cover-entrance], [data-cover-reflection]"),
  ).toHaveCount(0);
});
