import { expect, test } from "@playwright/test";

test("selected content reveals while skills and career remain static", async ({
  page,
}) => {
  await page.goto("/");
  const uncovered = await page.evaluate(() => {
    const copy = [
      ...document.querySelectorAll(
        "#work h2, #work [data-information-active] h3, #work [data-information-active] p, #about p, [data-journey-ending] p, #contact a",
      ),
    ];
    return copy
      .filter(
        (element) =>
          element.textContent?.trim() &&
          !element.matches("[data-element-reveal]") &&
          !element.querySelector("[data-copy-reveal], [data-gallery-lines]"),
      )
      .map((element) => element.textContent);
  });
  expect(uncovered).toEqual([]);
  await expect(page.locator("#work [data-gallery-panel]")).toHaveCount(4);
  await expect(page.locator("#work [data-selected-project] h3")).toHaveText(
    "LEXUS",
  );
  await expect(
    page.locator('#about [data-element-reveal="frame"]'),
  ).toHaveCount(1);
  await expect(
    page.locator(
      "[data-journey-page] [data-journey-chapter] h3 [data-copy-reveal]",
    ),
  ).toHaveCount(0);
  await expect(
    page.locator(
      "[data-journey-skills] [data-copy-reveal], [data-journey-skills] [data-element-reveal], [data-journey-page] aside [data-copy-reveal], [data-journey-page] aside [data-element-reveal], [data-journey-chapter] [data-element-reveal]",
    ),
  ).toHaveCount(0);
  await expect(
    page.locator(
      "[data-browser-entry] [data-copy-reveal], [data-browser-entry] [data-element-reveal]",
    ),
  ).toHaveCount(0);
});

test("career is immediately readable after browser entry and lower sections still reveal", async ({
  page,
}, info) => {
  await page.goto("/");
  const viewport = page.locator("[data-scroll-viewport]");
  await expect(viewport).toHaveAttribute("data-intro", "done");
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
    .locator("[data-journey-page] [data-journey-skills] h3")
    .first();
  await expect(skill).toHaveCSS("animation-name", "none");
  await viewport.evaluate(
    (element, top) => {
      element.scrollTop = top;
    },
    start + height * 0.74,
  );
  await expect(story).toHaveAttribute("data-entered", "true");
  await expect(skill).toBeVisible();
  for (const chapter of await page
    .locator("[data-journey-page] [data-journey-chapter]")
    .all()) {
    const title = chapter.locator("h3");
    await title.evaluate((element) =>
      element.scrollIntoView({ block: "center" }),
    );
    await expect(title).toHaveCSS("animation-name", "none");
    const text = chapter.locator("p").last();
    await text.evaluate((element) =>
      element.scrollIntoView({ block: "center" }),
    );
    await expect(text).toHaveCSS("opacity", "1");
    await expect(text).toHaveCSS("clip-path", "none");
  }
  const ending = page
    .locator("[data-journey-ending] p [data-copy-reveal]")
    .last();
  await ending.evaluate((element) =>
    element.scrollIntoView({ block: "center" }),
  );
  await expect(ending).toHaveAttribute("data-copy-entrance", "done");
  await page.screenshot({
    path: info.outputPath("ending-complete.png"),
    scale: "css",
  });
  const footerLink = page.locator('#contact a[href^="mailto:"]');
  await footerLink.evaluate((element) =>
    element.scrollIntoView({ block: "center" }),
  );
  await expect(footerLink).toHaveAttribute("data-element-state", "done");
  await expect(footerLink).toHaveAttribute("data-element-reveal", "button");
  await expect(footerLink).toHaveAttribute("href", "mailto:kingyska@nate.com");
  await viewport.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(page.locator('#contact a[href="#top"]')).toHaveAttribute(
    "data-element-state",
    "done",
  );
  await expect(page.locator("#contact [data-copy-reveal]")).toHaveAttribute(
    "data-copy-entrance",
    "done",
  );
  await page.screenshot({
    path: info.outputPath("footer-complete.png"),
    scale: "css",
  });
  await viewport.evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect(skill).toHaveCSS("animation-name", "none");
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

test("mixed Korean and Latin career copy stays readable without entrance wrappers", async ({
  page,
}) => {
  await page.goto("/#journey-2021");
  const organization = page
    .locator("#journey-2021 p")
    .filter({ hasText: "SBS아카데미컴퓨터아트학원" });
  await organization.evaluate((element) =>
    element.scrollIntoView({ block: "center" }),
  );
  await expect(organization).toHaveCSS("animation-name", "none");
  await expect(organization.locator("[data-copy-reveal]")).toHaveCount(0);
  const bounds = await organization.evaluate((element) => ({
    available: element.clientWidth,
    content: element.scrollWidth,
  }));
  expect(bounds.content).toBeLessThanOrEqual(bounds.available + 1);
});
