import { expect, test } from "@playwright/test";

test("about contains only a centred SVG that draws once at its area trigger", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const starts: number[] = [];
    (window as typeof window & { aboutStarts: number[] }).aboutStarts = starts;
    document.addEventListener("animationstart", (event) => {
      const target = event.target as HTMLElement;
      if (
        target.closest("#about") &&
        target.matches("[data-copy-reveal], [data-element-draw]")
      )
        starts.push(performance.now());
    });
  });
  await page.goto("/");
  const viewport = page.locator("[data-scroll-viewport]");
  await expect(viewport).toHaveAttribute("data-intro", "done");
  const about = page.locator("#about");
  const sketch = about.locator("[data-interface-sketch]");
  const frame = about.locator("[data-element-draw]");
  await expect(about.locator("p, [data-copy-reveal]")).toHaveCount(0);
  const alignment = await sketch.evaluate((element) => ({
    center:
      element.getBoundingClientRect().left +
      element.getBoundingClientRect().width / 2,
    viewport: document.querySelector("[data-scroll-viewport]")!.clientWidth / 2,
  }));
  expect(Math.abs(alignment.center - alignment.viewport)).toBeLessThan(1);
  const top = await frame.evaluate(
    (element) =>
      element.getBoundingClientRect().top +
      document.querySelector("[data-scroll-viewport]")!.scrollTop,
  );
  const height = await viewport.evaluate((element) => element.clientHeight);
  await viewport.evaluate(
    (element, value) => {
      element.scrollTop = value;
    },
    top - height * 0.9,
  );
  await page.waitForTimeout(150);
  await expect(sketch).not.toHaveAttribute("data-drawn", "true");
  await expect(frame).toHaveAttribute("data-element-state", "pending");
  await viewport.evaluate(
    (element, value) => {
      element.scrollTop = value;
    },
    top - height * 0.79,
  );
  await expect(sketch).toHaveAttribute("data-drawn", "true");
  await expect(frame).toHaveCSS("clip-path", "none");
  await expect(frame).toHaveAttribute("data-element-state", "done");
  await expect(
    about.locator("[data-handwritten], [data-typewriter]"),
  ).toHaveCount(0);
  const starts = await page.evaluate(
    () => (window as typeof window & { aboutStarts: number[] }).aboutStarts,
  );
  expect(starts).toHaveLength(1);
  await viewport.evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect(sketch).toHaveAttribute("data-drawn", "true");
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { aboutStarts: number[] }).aboutStarts
          .length,
    ),
  ).toBe(1);
});
