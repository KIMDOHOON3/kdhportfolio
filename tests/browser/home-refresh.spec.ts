import { expect, test } from "@playwright/test";

test("refresh clears the home section and replays the entrance while menu navigation still works", async ({
  page,
}) => {
  await page.goto("/");
  const viewport = page.locator("[data-scroll-viewport]");
  await expect(viewport).toHaveAttribute("data-intro", "done");
  const goToAbout = async () => {
    const trigger = page.locator("#navTrigger");
    if (await trigger.isVisible()) await trigger.click();
    await page
      .locator("header nav")
      .getByRole("link", { name: "ABOUT", exact: true })
      .click();
    await expect(page).toHaveURL(/\/#about$/);
    await expect
      .poll(() => viewport.evaluate((e) => e.scrollTop))
      .toBeGreaterThan(500);
  };
  await goToAbout();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/$/);
  await expect(viewport).toHaveAttribute("data-intro-copy", "waiting");
  await expect.poll(() => viewport.evaluate((e) => e.scrollTop)).toBe(0);
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute(
    "data-hero-entrance",
    "done",
  );
  await expect(viewport).toHaveAttribute("data-intro", "done");
  await expect.poll(() => viewport.evaluate((e) => e.scrollTop)).toBe(0);
  await goToAbout();
});

test("direct section links and detail-page refreshes retain their anchors", async ({
  page,
}) => {
  await page.goto("/#about");
  await expect(page).toHaveURL(/\/#about$/);
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
  await expect
    .poll(() =>
      page.locator("[data-scroll-viewport]").evaluate((e) => e.scrollTop),
    )
    .toBeGreaterThan(500);
  await page.goto("/work/1#operations");
  await page.reload();
  await expect(page).toHaveURL(/\/work\/1#operations$/);
  await expect
    .poll(() =>
      page.locator("[data-scroll-viewport]").evaluate((e) => e.scrollTop),
    )
    .toBeGreaterThan(500);
});
