import { expect, test } from "@playwright/test";

test("all main content after the hero is covered without animating the portal preview twice", async ({
  page,
}) => {
  await page.goto("/");
  const uncovered = await page.evaluate(() => {
    const copy = [
      ...document.querySelectorAll(
        "#work h2, #work h3, #work p, #about p, [data-journey-page] h2, [data-journey-page] h3, [data-journey-page] p, #contact a",
      ),
    ];
    return copy
      .filter(
        (element) =>
          element.textContent?.trim() &&
          !element.matches("[data-element-reveal]") &&
          !element.querySelector("[data-copy-reveal]"),
      )
      .map((element) => element.textContent);
  });
  expect(uncovered).toEqual([]);
  await expect(page.locator("#work [data-project-action]")).toHaveCount(4);
  await expect(
    page.locator('#about [data-element-reveal="frame"]'),
  ).toHaveCount(1);
  await expect(
    page.locator(
      "[data-journey-page] [data-journey-chapter] h3 [data-copy-reveal]",
    ),
  ).toHaveCount(5);
  await expect(
    page.locator(
      "[data-browser-entry] [data-copy-reveal], [data-browser-entry] [data-element-reveal]",
    ),
  ).toHaveCount(0);
});

test("journey copy waits until the browser entry completes and all lower sections reveal once", async ({
  page,
}, info) => {
  await page.goto("/");
  const viewport = page.locator("[data-scroll-viewport]");
  const story = page.locator("[data-journey]");
  await expect(story).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => document.fonts.ready);
  const start = await story.evaluate(
    (element) =>
      element.getBoundingClientRect().top +
      document.querySelector("[data-scroll-viewport]")!.scrollTop,
  );
  const height = page.viewportSize()!.height;
  await viewport.evaluate(
    (element, top) => {
      element.scrollTop = top;
    },
    start + height * 0.025,
  );
  await expect(story).toHaveAttribute("data-phase", "entering");
  const skill = page
    .locator("[data-journey-page] [data-journey-skills] h3 [data-copy-reveal]")
    .first();
  await expect(skill).toHaveAttribute("data-copy-entrance", "pending");
  await viewport.evaluate(
    (element, top) => {
      element.scrollTop = top;
    },
    start + height * 0.74,
  );
  await expect(story).toHaveAttribute("data-entered", "true");
  await expect(skill).toHaveAttribute("data-copy-entrance", "done");
  const font = await skill.evaluate((element) => ({
    parent: getComputedStyle(element.parentElement!).fontSize,
    text: getComputedStyle(element).fontSize,
  }));
  expect(font.text).toBe(font.parent);
  for (const chapter of await page
    .locator("[data-journey-page] [data-journey-chapter]")
    .all()) {
    const title = chapter.locator("h3 [data-copy-reveal]");
    await title.scrollIntoViewIfNeeded();
    await expect(title).toHaveAttribute("data-copy-entrance", "done");
    const text = chapter.locator("p").last().locator("[data-copy-reveal]");
    await text.scrollIntoViewIfNeeded();
    await expect(text).toHaveAttribute("data-copy-entrance", "done");
  }
  const ending = page
    .locator("[data-journey-ending] p [data-copy-reveal]")
    .last();
  await ending.scrollIntoViewIfNeeded();
  await expect(ending).toHaveAttribute("data-copy-entrance", "done");
  await page.screenshot({
    path: info.outputPath("ending-complete.png"),
    scale: "css",
  });
  const footerLink = page.locator('#contact a[href^="mailto:"]');
  await footerLink.scrollIntoViewIfNeeded();
  await expect(footerLink).toHaveAttribute("data-element-state", "done");
  await expect(footerLink.locator("[data-copy-reveal]")).toHaveAttribute(
    "data-copy-entrance",
    "done",
  );
  await expect(footerLink).toHaveAttribute("href", "mailto:kingyska@nate.com");
  await page.screenshot({
    path: info.outputPath("footer-complete.png"),
    scale: "css",
  });
  await viewport.evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect(skill).toHaveAttribute("data-copy-entrance", "done");
});

test("reduced motion keeps every added element visible and controls remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.locator(
      '[data-element-state="pending"], [data-copy-entrance="pending"]',
    ),
  ).toHaveCount(0);
  const mail = page.locator('#contact a[href^="mailto:"]');
  await mail.focus();
  await expect(mail).toBeFocused();
  await expect(mail).toHaveCSS("clip-path", "none");
  await expect(
    page.locator("[data-journey-page] [data-journey-skills]"),
  ).toBeVisible();
});

test("mixed Korean and Latin text stays within its original line boxes during entry", async ({
  page,
}) => {
  await page.addInitScript(() => {
    document.addEventListener("animationstart", (event) => {
      const target = event.target as HTMLElement;
      const paragraph = target.closest("#journey-2021 p");
      if (paragraph?.textContent?.includes("SBS"))
        target.getAnimations().forEach((animation) => animation.pause());
    });
  });
  await page.goto("/#journey-2021");
  const organization = page
    .locator("#journey-2021 p")
    .filter({ hasText: "SBS아카데미컴퓨터아트학원" })
    .locator("[data-copy-reveal]");
  await organization.scrollIntoViewIfNeeded();
  await expect(organization).toHaveAttribute("data-copy-entrance", "playing");
  const bounds = await organization.evaluate((element) => ({
    source: element.firstElementChild!.getBoundingClientRect().height,
    animated: element.querySelector('[aria-hidden="true"]')!.scrollHeight,
  }));
  expect(bounds.animated).toBeLessThanOrEqual(bounds.source + 1);
});
