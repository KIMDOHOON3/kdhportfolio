import { expect, test } from "@playwright/test";

test("secondary detail action keeps readable text on hover and keyboard focus", async ({
  page,
}, info) => {
  await page.goto("/work/5");
  const action = page.getByRole("link", {
    name: "GitHub 코드 보기",
    exact: true,
  });
  const originalColor = await action.evaluate((e) => getComputedStyle(e).color);
  expect(originalColor).toBe("rgb(32, 38, 45)");
  const bounds = await action.boundingBox();
  if (!info.project.use.isMobile) {
    await action.hover();
    await expect(action).toHaveCSS("color", originalColor);
  }
  await action.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(action).toBeFocused();
  await expect(action).toHaveCSS("color", originalColor);
  expect((await action.boundingBox())!.width).toBeCloseTo(bounds!.width, 1);
});

test("main and detail actions use the shared effect and keep their destinations", async ({
  page,
}) => {
  for (const route of ["/", "/work/1", "/work/3"]) {
    await page.goto(route);
    const missing = await page
      .locator("main a, main button, footer a")
      .evaluateAll((elements) =>
        elements
          .filter(
            (e) =>
              !e.closest("[data-journey-nav], [data-browser-entry] nav") &&
              !e.hasAttribute("data-button-effect"),
          )
          .map((e) => e.textContent?.trim()),
      );
    expect(missing).toEqual([]);
    await expect(
      page
        .locator("header")
        .first()
        .locator(
          "[data-button-effect], [data-button-label], [data-button-light]",
        ),
    ).toHaveCount(0);
    await expect(
      page.locator(
        "[data-journey-nav] [data-button-label], [data-journey-nav] [data-button-light]",
      ),
    ).toHaveCount(0);
    await expect(page.locator('footer a[href^="mailto:"]')).toHaveAttribute(
      "href",
      "mailto:kingyska@nate.com",
    );
    await expect(page.locator("footer a[download]")).toHaveAttribute(
      "href",
      "/resume/김도훈-이력서.pdf",
    );
    expect(
      await page
        .locator("[data-scroll-viewport]")
        .evaluate((e) => e.scrollWidth - e.clientWidth),
    ).toBe(0);
  }
});

test("portal controls stay aligned across small forward and reverse scroll steps", async ({
  page,
}) => {
  await page.goto("/");
  const story = page.locator("[data-journey]");
  await expect(story).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => document.fonts.ready);
  const boundary = await story.evaluate((e) => {
    const viewport = document.querySelector<HTMLElement>(
      "[data-scroll-viewport]",
    )!;
    return (
      e.getBoundingClientRect().top +
      viewport.scrollTop +
      (Number(viewport.dataset.layoutHeight) || viewport.clientHeight) * 0.7
    );
  });
  const viewport = page.locator("[data-scroll-viewport]");
  await expect(viewport).toHaveAttribute("data-intro", "done");
  for (const offset of [-2, 2, -1, 1, -2]) {
    await viewport.evaluate((e, top) => {
      e.scrollTop = top;
    }, boundary + offset);
    await expect(story).toHaveAttribute(
      "data-entered",
      offset < 0 ? "false" : "true",
    );
    if (offset > 0) continue;
    await expect(story).toHaveAttribute("data-phase", "entering");
    const deltas = await page.evaluate(() => {
      const preview = document.querySelector("[data-browser-entry]")!;
      const actual = document.querySelector("[data-journey-page]")!;
      return [
        ["a[download]", "a[download]"],
        ["[data-preview-pause]", "button"],
      ].map(([a, b]) => {
        const x = preview.querySelector(a)!.getBoundingClientRect();
        const y = actual.querySelector(b)!.getBoundingClientRect();
        return Math.max(
          Math.abs(x.top - y.top),
          Math.abs(x.left - y.left),
          Math.abs(x.width - y.width),
          Math.abs(x.height - y.height),
        );
      });
    });
    deltas.forEach((delta) => expect(delta).toBeLessThan(1.5));
  }
});
