import { expect, test } from "@playwright/test";

test("projects fade in once with a small row stagger and keep their layout", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    const transitions: string[] = [];
    (
      window as typeof window & { contentTransitions: string[] }
    ).contentTransitions = transitions;
    document.addEventListener("transitionrun", (event) => {
      const target = event.target as HTMLElement;
      if (target.dataset.reveal && event.propertyName === "opacity")
        transitions.push(target.dataset.reveal);
    });
  });
  await page.goto("/");
  const viewport = page.locator("[data-scroll-viewport]");
  await expect(viewport).toHaveAttribute("data-intro", "done");
  const cards = page.locator("#work article");
  const first = cards.nth(0);
  const second = cards.nth(1);
  await expect(first).toHaveCSS("opacity", "0");
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
  await expect(page).toHaveURL(/#work$/);
  await expect(page.locator('[data-reveal="work-heading"]')).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(page.locator('[data-reveal="work-filters"]')).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(first).toHaveCSS("opacity", "1");
  await expect(first).toHaveCSS("transition-property", "opacity");
  await expect(first).toHaveCSS("transition-duration", "0.6s");
  await expect(first).toHaveCSS("filter", "none");
  await expect(first).toHaveCSS("transform", "none");
  // Finish the CTA's smooth anchor navigation before a separate native
  // scrollIntoView; otherwise the still-running anchor can overwrite it.
  await expect(viewport).not.toHaveClass(/lenis-scrolling/);
  if (info.project.use.isMobile) {
    await second.scrollIntoViewIfNeeded();
    await expect(second).toHaveCSS("transition-delay", "0.1s");
  } else {
    await expect(second).toHaveCSS("transition-delay", "0.2s");
  }
  await expect(second).toHaveCSS("opacity", "1");
  expect(await geometry()).toEqual(before);
  const transitions = () =>
    page.evaluate(() =>
      (
        window as typeof window & { contentTransitions: string[] }
      ).contentTransitions.filter((key) => key.startsWith("project-")),
    );
  const played = await transitions();
  expect(played.filter((key) => key === "project-1")).toHaveLength(1);
  await viewport.evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect(first).toHaveCSS("opacity", "1");
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveCSS("opacity", "1");
  const filters = page.getByRole("group", { name: "프로젝트 필터" });
  await filters.getByRole("button", { name: "개인 02", exact: true }).click();
  await filters.getByRole("button", { name: "전체 04", exact: true }).click();
  await expect(first).toHaveCSS("opacity", "1");
  expect(
    (await transitions()).filter((key) => key === "project-1"),
  ).toHaveLength(1);
  const intro = page.locator('[data-reveal="about-lead"]');
  await intro.scrollIntoViewIfNeeded();
  await expect(intro).toHaveCSS("opacity", "1");
  await expect(page.locator('[data-reveal="about-description"]')).toHaveCount(
    1,
  );
  await expect(
    page.locator(
      "[data-journey] [data-reveal], #contact [data-reveal], #home [data-reveal]",
    ),
  ).toHaveCount(0);
  const path = info.outputPath("projects-fade-complete.png");
  await first.scrollIntoViewIfNeeded();
  await page.screenshot({ path, scale: "css" });
  await info.attach("projects-fade-complete", {
    path,
    contentType: "image/png",
  });
});

test("reduced motion and keyboard focus reveal content immediately", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const target of await page.locator("[data-reveal]").all()) {
    await expect(target).toHaveCSS("opacity", "1");
    await expect(target).toHaveCSS("transition-duration", "0s");
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const link = page.getByRole("link", {
    name: "Aeppy 프로젝트 보기",
    exact: true,
  });
  await link.focus();
  await expect(link).toBeFocused();
  await expect(page.locator('[data-reveal="project-5"]')).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(page.locator('[data-reveal="project-5"]')).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const target of await page.locator("[data-reveal]").all())
    await expect(target).toHaveCSS("opacity", "1");
});

test("project and introduction content stays readable without JavaScript", async ({
  browser,
}, info) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: info.project.use.viewport,
  });
  const page = await context.newPage();
  await page.goto(process.env.PORTFOLIO_URL ?? "http://localhost:3010");
  await expect(page.locator("[data-reveal]")).toHaveCount(8);
  for (const target of await page.locator("[data-reveal]").all())
    await expect(target).toHaveCSS("opacity", "1");
  await context.close();
});
