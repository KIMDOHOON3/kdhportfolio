import { expect, test } from "@playwright/test";

test("header stays transparent through the hero and becomes readable near its end and on detail scroll", async ({
  page,
}, info) => {
  const viewport = page.locator("[data-scroll-viewport]");
  const header = page.getByRole("banner");
  const opacity = () =>
    header.evaluate((element) => getComputedStyle(element, "::before").opacity);
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(viewport).toHaveAttribute("data-intro", "done");
  await expect.poll(opacity).toBe("0");
  const bounds = await header.boundingBox();
  const scale = await page.evaluate(() =>
    navigator.maxTouchPoints > 0 ? devicePixelRatio : 1,
  );
  await page.mouse.move(100, 250);
  const height = page.viewportSize()!.height;
  await page.mouse.wheel(0, height * 0.25 * scale);
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(height * 0.2);
  await expect(viewport).toHaveAttribute("data-scrolled", "false");
  await expect.poll(opacity).toBe("0");
  await page.mouse.wheel(0, height * 0.7 * scale);
  await expect(viewport).toHaveAttribute("data-scrolled", "true");
  await expect.poll(opacity).toBe("1");
  expect(await header.boundingBox()).toEqual(bounds);
  await page.screenshot({
    path: info.outputPath("header-scrolled.png"),
    scale: "css",
  });
  await page.getByRole("link", { name: "김도훈 포트폴리오 홈" }).click();
  await expect(viewport).toHaveAttribute("data-scrolled", "false");
  await expect.poll(opacity).toBe("0");
  await page.goto("/work/3");
  await expect.poll(opacity).toBe("0");
  await page.mouse.move(100, 250);
  await page.mouse.wheel(0, 600 * scale);
  await expect.poll(opacity).toBe("1");
  await page.getByRole("link", { name: "김도훈 포트폴리오 홈" }).click();
  await page.waitForURL("**/#top");
  await expect(viewport).toHaveAttribute("data-scrolled", "false");
  await expect.poll(opacity).toBe("0");
});

test("menu supports section navigation and mobile keyboard dismissal", async ({
  page,
}, info) => {
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
    await expect(
      nav.getByRole("link", { name: "HOME", exact: true }),
    ).not.toBeFocused();
    await page.keyboard.press("Escape");
    await expect(nav).toBeHidden();
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Space");
    await expect(
      nav.getByRole("link", { name: "HOME", exact: true }),
    ).toBeFocused();
  } else {
    await expect(nav).toBeVisible();
    await nav.getByRole("link", { name: "WORK", exact: true }).hover();
  }

  await expect(nav.getByRole("link")).toHaveText(["HOME", "WORK", "ABOUT"]);
  const path = info.outputPath("menu.png");
  await page.screenshot({ path, scale: "css" });
  await info.attach("menu", { path, contentType: "image/png" });

  for (const item of ["WORK", "ABOUT", "HOME"]) {
    if (mobile && (await trigger.getAttribute("aria-expanded")) === "false")
      await trigger.click();
    await nav.getByRole("link", { name: item, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${item.toLowerCase()}$`));
    await expect
      .poll(() =>
        page
          .locator(`#${item.toLowerCase()}`)
          .evaluate((element) => Math.abs(element.getBoundingClientRect().top)),
      )
      .toBeLessThan(3);
    if (mobile) {
      await expect(nav).toBeHidden();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    }
  }
});
