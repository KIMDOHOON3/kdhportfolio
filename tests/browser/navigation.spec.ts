import { expect, test } from "@playwright/test";

test("menu supports section navigation and mobile keyboard dismissal", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const header = page.locator("header");
  const nav = header.locator("nav");
  const trigger = header.locator("#navTrigger");
  const mobile = await trigger.isVisible();

  if (mobile) {
    await expect(nav).toBeHidden();
    await trigger.click();
    await expect(nav).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(nav.getByRole("link", { name: "HOME", exact: true })).not.toBeFocused();
    await page.keyboard.press("Escape");
    await expect(nav).toBeHidden();
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Space");
    await expect(nav.getByRole("link", { name: "HOME", exact: true })).toBeFocused();
  } else {
    await expect(nav).toBeVisible();
    await nav.getByRole("link", { name: "WORK", exact: true }).hover();
  }

  await expect(nav.getByRole("link")).toHaveText(["HOME", "WORK", "ABOUT"]);
  const path = info.outputPath("menu.png");
  await page.screenshot({ path, scale: "css" });
  await info.attach("menu", { path, contentType: "image/png" });

  for (const item of ["WORK", "ABOUT", "HOME"]) {
    if (mobile && await trigger.getAttribute("aria-expanded") === "false")
      await trigger.click();
    await nav.getByRole("link", { name: item, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${item.toLowerCase()}$`));
    await expect.poll(() => page.locator(`#${item.toLowerCase()}`).evaluate(
      element => Math.abs(element.getBoundingClientRect().top),
    )).toBeLessThan(3);
    if (mobile) {
      await expect(nav).toBeHidden();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    }
  }
});
