import { expect, test } from "@playwright/test";

test("career navigation changes selection without shifting its text or dimensions", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("[data-journey]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.evaluate(() => document.fonts.ready);
  const links = page.locator("[data-journey-nav] a");
  const geometry = () =>
    links.evaluateAll((elements) =>
      elements.map((e) => {
        const link = e.getBoundingClientRect();
        const label = e.firstElementChild!.getBoundingClientRect();
        return {
          textInset: label.left - link.left,
          width: link.width,
          height: link.height,
        };
      }),
    );
  await links.first().press("Enter");
  await expect(links.first()).toHaveAttribute("aria-current", "step");
  const before = await geometry();
  await links.nth(1).press("Enter");
  await expect(links.nth(1)).toHaveAttribute("aria-current", "step");
  const after = await geometry();
  after.forEach((rect, index) => {
    expect(rect.textInset).toBeCloseTo(before[index].textInset, 1);
    expect(rect.width).toBeCloseTo(before[index].width, 1);
    expect(rect.height).toBeCloseTo(before[index].height, 1);
  });
});

test("timeline markers and rolling skills stay continuous through the portal handoff", async ({
  page,
}) => {
  await page.goto("/");
  const journey = page.locator("[data-journey]");
  await expect(journey).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => document.fonts.ready);
  const boundary = await journey.evaluate((e) => {
    const viewport = document.querySelector<HTMLElement>(
      "[data-scroll-viewport]",
    )!;
    return (
      e.getBoundingClientRect().top +
      viewport.scrollTop +
      (Number(viewport.dataset.layoutHeight) || viewport.clientHeight) * 0.7
    );
  });
  await page.locator("[data-scroll-viewport]").evaluate((e, top) => {
    e.scrollTop = top;
  }, boundary - 2);
  await expect(journey).toHaveAttribute("data-phase", "entering");
  const markers = await page.evaluate(() => {
    const preview = [
      ...document.querySelectorAll(
        "[data-browser-entry] [data-journey-milestone]",
      ),
    ];
    const actual = [
      ...document.querySelectorAll(
        "[data-journey-page] [data-journey-milestone]",
      ),
    ];
    return preview.map((e, i) => {
      const a = e.getBoundingClientRect(),
        b = actual[i].getBoundingClientRect();
      return {
        dx: Math.abs(a.left - b.left),
        dy: Math.abs(a.top - b.top),
        sameColor:
          getComputedStyle(e).backgroundColor ===
          getComputedStyle(actual[i]).backgroundColor,
      };
    });
  });
  expect(markers).toHaveLength(5);
  markers.forEach((marker) => {
    expect(marker.dx).toBeLessThan(1.5);
    expect(marker.dy).toBeLessThan(1.5);
    expect(marker.sameColor).toBe(true);
  });
  const progress = await page
    .locator("[data-journey-preview-line], [data-journey-line]")
    .evaluateAll((elements) =>
      elements.map((e) =>
        (e as HTMLElement).style.getPropertyValue("--line-progress"),
      ),
    );
  expect(progress[0]).toBe(progress[1]);

  await page.locator("[data-scroll-viewport]").evaluate((e, top) => {
    e.scrollTop = top;
  }, boundary + 2);
  await expect(journey).toHaveAttribute("data-entered", "true");
  const track = page.locator("[data-journey-page] [data-skills-track]");
  await expect(track).toBeVisible();
  const bounds = (await track.boundingBox())!;
  await page.mouse.move(page.viewportSize()!.width * 0.6, bounds.y + 20);
  await expect(track).toHaveCSS("animation-play-state", "running");
  const time = () =>
    track.evaluate((e) => Number(e.getAnimations()[0]?.currentTime));
  const before = await time();
  await expect.poll(time).toBeGreaterThan(before + 80);
  const pause = page.getByRole("button", { name: "스킬 롤링 일시 정지" });
  await pause.click();
  await expect(track).toHaveCSS("animation-play-state", "paused");
  await page.getByRole("button", { name: "스킬 롤링 재생" }).click();
  await expect(track).toHaveCSS("animation-play-state", "running");
});
