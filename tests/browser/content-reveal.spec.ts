import { expect, test } from "@playwright/test";

test("projects use the original Mist mask, settle cleanly and do not replay", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    const transitions: string[] = [];
    (
      window as typeof window & { contentTransitions: string[] }
    ).contentTransitions = transitions;
    new MutationObserver((records) => {
      for (const record of records) {
        const target = record.target as HTMLElement;
        if (target.dataset.reveal && target.dataset.revealState === "revealing")
          transitions.push(target.dataset.reveal);
      }
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-reveal-state"],
    });
  });
  await page.goto("/");
  const viewport = page.locator("[data-scroll-viewport]");
  await expect(viewport).toHaveAttribute("data-intro", "done");
  const cards = page.locator("#work article");
  const first = cards.nth(0);
  const second = cards.nth(1);
  await expect(first).toHaveAttribute("data-reveal-state", "pending");
  await expect(first).toHaveAttribute("data-reveal-effect", "mist");
  const surface = first.locator(":scope > a");
  await expect(surface).toHaveCSS("filter", /fade-content-mask.*blur\(10px\)/);
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
  await expect(first).toHaveAttribute("data-reveal-state", "revealing");
  await expect(surface).toHaveCSS("filter", /fade-content-mask.*blur\(/);
  const mask = await surface.evaluate((element) => {
    const id = (element as HTMLElement).style.filter.match(/#([^"\)]+)/)?.[1];
    const filter = id ? document.getElementById(id) : null;
    return {
      octaves: filter
        ?.querySelector("feTurbulence")
        ?.getAttribute("numOctaves"),
      hasCurve: !!filter?.querySelector("feFuncA"),
    };
  });
  expect(mask).toEqual({ octaves: "3", hasCurve: true });
  await page.waitForTimeout(350);
  await page.screenshot({
    path: info.outputPath("projects-mist-revealing.png"),
    scale: "css",
  });
  await expect(first).toHaveAttribute("data-reveal-state", "done");
  await expect(surface).toHaveCSS("filter", "none");
  await expect(surface).toHaveCSS("transform", "none");
  // Finish the CTA's smooth anchor navigation before a separate native
  // scrollIntoView; otherwise the still-running anchor can overwrite it.
  await expect(viewport).not.toHaveClass(/lenis-scrolling/);
  if (info.project.use.isMobile) {
    await second.scrollIntoViewIfNeeded();
  }
  await expect(second).toHaveAttribute("data-reveal-state", "done");
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
  await expect(first).toHaveAttribute("data-reveal-state", "done");
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveAttribute("data-reveal-state", "done");
  const filters = page.getByRole("group", { name: "프로젝트 필터" });
  await filters.getByRole("button", { name: "개인 02", exact: true }).click();
  await filters.getByRole("button", { name: "전체 04", exact: true }).click();
  await expect(first).toHaveAttribute("data-reveal-state", "done");
  expect(
    (await transitions()).filter((key) => key === "project-1"),
  ).toHaveLength(1);
  const intro = page.locator('[data-reveal="about-lead"]');
  await intro.scrollIntoViewIfNeeded();
  await expect(intro).toHaveAttribute("data-reveal-state", "done");
  await expect(page.locator('[data-reveal="about-description"]')).toHaveCount(
    1,
  );
  await expect(
    page.locator(
      "[data-journey] [data-reveal], #contact [data-reveal], #home [data-reveal]",
    ),
  ).toHaveCount(0);
  const path = info.outputPath("projects-mist-complete.png");
  await first.scrollIntoViewIfNeeded();
  await page.screenshot({ path, scale: "css" });
  await info.attach("projects-mist-complete", {
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
    await expect(target).toHaveAttribute("data-reveal-state", "done");
    await expect(target).toHaveCSS("opacity", "1");
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
  await expect(page.locator('[data-reveal="project-5"]')).toHaveAttribute(
    "data-reveal-state",
    "done",
  );
  await expect(link).toHaveCSS("filter", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const target of await page.locator("[data-reveal]").all()) {
    await expect(target).toHaveCSS("opacity", "1");
    await expect(target).toHaveAttribute("data-reveal-state", "done");
  }
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
