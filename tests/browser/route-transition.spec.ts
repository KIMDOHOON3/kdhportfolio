import { expect, test } from "@playwright/test";

test("project entry, history navigation and list return release the transition and restore scroll", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#work");
  await page.evaluate(() => document.fonts.ready);
  const viewport = page.locator("[data-scroll-viewport]");
  const transition = page.locator("[data-route-transition]");
  await expect(viewport).toHaveAttribute("data-intro", "done");
  // Keep a reference to the persistent canvas across actual route changes.
  await page.evaluate(() => {
    (window as Window & { originalCanvas?: Element | null }).originalCanvas =
      document.querySelector("[data-glass-scene] canvas");
  });
  const card = page.getByRole("link", {
    name: "LEXUS 프로젝트 보기",
    exact: true,
  });
  await card.scrollIntoViewIfNeeded();
  const savedTop = await viewport.evaluate((element) => element.scrollTop);
  await card.click();
  await expect(transition).toHaveAttribute("data-active", "true");
  await expect(transition).toHaveAttribute("data-direction", "forward");
  if ((await transition.getAttribute("data-gallery-flight")) === "true")
    await expect(transition.locator("canvas")).toHaveCount(1);
  else await expect(transition.locator("canvas")).toHaveCount(0);
  await expect(page).toHaveURL(/\/work\/1$/);
  await expect(transition).toHaveAttribute("data-active", "false");
  await expect(page.locator("#main-content")).toHaveCSS("transform", "none");
  const arrival = await page.locator("#project-title").boundingBox();
  await page.waitForTimeout(100);
  const settled = await page.locator("#project-title").boundingBox();
  expect(settled!.y).toBeCloseTo(arrival!.y, 1);
  expect(settled!.width).toBeCloseTo(arrival!.width, 1);
  // The image-led arrival keeps the title restrained and the destination image
  // above the fold, instead of expanding into an oversized title-only screen.
  const titleSize = await page
    .locator("#project-title")
    .evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  expect(titleSize).toBeLessThanOrEqual(
    page.viewportSize()!.width <= 760 ? 56 : 88,
  );
  const hero = await page
    .locator("[data-project-transition-cover]")
    .boundingBox();
  expect(hero!.y).toBeLessThan(page.viewportSize()!.height * 0.55);
  await expect(
    page.getByRole("heading", { name: "LEXUS", exact: true }),
  ).toBeFocused();
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBeLessThan(2);
  expect(
    await page.evaluate(() => {
      const original = (window as Window & { originalCanvas?: Element | null })
        .originalCanvas;
      return (
        !original ||
        original === document.querySelector("[data-glass-scene] canvas")
      );
    }),
  ).toBe(true);

  await page.goBack();
  await expect(page).toHaveURL(/\/#work$/);
  await expect(transition).toHaveAttribute("data-direction", "back");
  await expect(transition).toHaveAttribute("data-active", "false");
  await expect
    .poll(async () =>
      Math.abs(
        (await viewport.evaluate((element) => element.scrollTop)) - savedTop,
      ),
    )
    .toBeLessThan(3);
  await expect(card).toBeFocused();

  await page.goForward();
  await expect(page).toHaveURL(/\/work\/1$/);
  await expect(transition).toHaveAttribute("data-direction", "forward");
  await expect(transition).toHaveAttribute("data-active", "false");
  await page
    .getByRole("link", { name: "← 프로젝트 목록으로", exact: true })
    .click();
  await expect(page).toHaveURL(/\/#work$/);
  await expect(transition).toHaveAttribute("data-direction", "back");
  await expect(transition).toHaveAttribute("data-active", "false");
  await expect(viewport).not.toHaveAttribute("data-route-lock", "true");
  await expect
    .poll(async () =>
      Math.abs(
        (await viewport.evaluate((element) => element.scrollTop)) - savedTop,
      ),
    )
    .toBeLessThan(3);
  expect(errors).toEqual([]);
});

test("history can interrupt arrival without leaving the screen or scrolling locked", async ({
  page,
}) => {
  await page.goto("/#work");
  await page.evaluate(() => {
    const root = document.querySelector("[data-route-transition]")!;
    const observer = new MutationObserver(() => {
      if ((root as HTMLElement).dataset.phase !== "enter") return;
      for (const element of [
        document.getElementById("main-content"),
        root.querySelector("[data-route-veil]"),
      ]) {
        element
          ?.getAnimations()
          .forEach((animation) => animation.updatePlaybackRate(0.2));
      }
      observer.disconnect();
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-phase"],
    });
  });
  await page
    .getByRole("link", { name: "LEXUS 프로젝트 보기", exact: true })
    .click();
  await expect(page).toHaveURL(/\/work\/1$/);
  await expect(page.locator("[data-route-transition]")).toHaveAttribute(
    "data-active",
    "true",
  );
  await page.goBack();
  await expect(page).toHaveURL(/\/#work$/);
  await expect(page.locator("[data-route-transition]")).toHaveAttribute(
    "data-active",
    "false",
  );
  await expect(page.locator("[data-scroll-viewport]")).not.toHaveAttribute(
    "data-route-lock",
    "true",
  );
  await page
    .getByRole("navigation", { name: "프로젝트 바로 선택" })
    .getByRole("button", { name: /Aeppy/ })
    .click();
  await page
    .getByRole("link", { name: "Aeppy 프로젝트 보기", exact: true })
    .click();
  await expect(page).toHaveURL(/\/work\/5$/);
  await expect(page.locator("[data-route-transition]")).toHaveAttribute(
    "data-active",
    "false",
  );
});

test("returning after reading a detail uses a short transition and restores the selected filtered gallery", async ({
  page,
}) => {
  await page.goto("/#work");
  const viewport = page.locator("[data-scroll-viewport]");
  const transition = page.locator("[data-route-transition]");
  await expect(page.locator("[data-gallery-canvas]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.getByRole("button", { name: "개인 02", exact: true }).click();
  await page
    .getByRole("navigation", { name: "프로젝트 바로 선택" })
    .getByRole("button", { name: /Dog Atlas/ })
    .click();
  const card = page.getByRole("link", {
    name: "Dog Atlas 프로젝트 보기",
    exact: true,
  });
  await card.scrollIntoViewIfNeeded();
  const savedTop = await viewport.evaluate((element) => element.scrollTop);
  await card.click();
  await expect(page).toHaveURL(/\/work\/4$/);
  await expect(transition).toHaveAttribute("data-active", "false");

  // Reading below the hero must not animate a shared image from a rectangle
  // above the viewport. Record any attempted flight even if it is brief.
  await page.mouse.move(250, 450);
  await page.mouse.wheel(0, 1800);
  await expect
    .poll(
      async () =>
        (await page.locator("[data-project-transition-cover]").boundingBox())!
          .y,
    )
    .toBeLessThan(-100);
  await page.evaluate(() => {
    const layer = document.querySelector<HTMLElement>(
      "[data-route-transition]",
    )!;
    const state = { sharedFlight: false };
    (window as Window & { readingReturn?: typeof state }).readingReturn = state;
    new MutationObserver(() => {
      if (layer.dataset.galleryFlight === "true") state.sharedFlight = true;
    }).observe(layer, {
      attributes: true,
      attributeFilter: ["data-gallery-flight"],
    });
  });
  await page.goBack();
  await expect(page).toHaveURL(/\/#work$/);
  await expect(transition).toHaveAttribute("data-active", "false");
  expect(
    await page.evaluate(
      () =>
        (window as Window & { readingReturn?: { sharedFlight: boolean } })
          .readingReturn!.sharedFlight,
    ),
  ).toBe(false);
  await expect(
    page.getByRole("button", { name: "개인 02", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-selected-project]")).toHaveAttribute(
    "data-selected-project",
    "4",
  );
  await expect(card).toBeFocused();
  await expect
    .poll(async () =>
      Math.abs(
        (await viewport.evaluate((element) => element.scrollTop)) - savedTop,
      ),
    )
    .toBeLessThan(3);
  await expect(viewport).not.toHaveAttribute("data-route-lock", "true");
});

test("reduced motion keeps direct navigation, anchors and new-tab links available", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/work/3");
  await expect(page.locator("[data-route-transition] canvas")).toHaveCount(0);
  const transition = page.locator("[data-route-transition]");
  await expect(transition).toHaveAttribute("data-active", "false");
  await page
    .getByRole("link", { name: "← 프로젝트 목록으로", exact: true })
    .click();
  await expect(page).toHaveURL(/\/#work$/);
  await page
    .getByRole("navigation", { name: "프로젝트 바로 선택" })
    .getByRole("button", { name: /Aeppy/ })
    .click();
  await page
    .getByRole("link", { name: "Aeppy 프로젝트 보기", exact: true })
    .click();
  await expect(page).toHaveURL(/\/work\/5$/);
  await expect(transition).toHaveAttribute("data-active", "false");
  const site = page.getByRole("link", { name: "사이트 바로가기", exact: true });
  await expect(site).toHaveAttribute("target", "_blank");
  await expect(page.locator("[data-scroll-viewport]")).not.toHaveAttribute(
    "data-route-lock",
    "true",
  );
});
