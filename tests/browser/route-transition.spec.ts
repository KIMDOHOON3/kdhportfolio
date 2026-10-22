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
  const tunnel = page.locator("[data-route-tunnel]");
  await expect(tunnel).toHaveAttribute("data-ready", "true");
  const buffer = await tunnel.evaluate((element) => ({
    width: (element as HTMLCanvasElement).width,
    height: (element as HTMLCanvasElement).height,
  }));
  expect(buffer.width).toBeLessThanOrEqual(560);
  expect(buffer.height).toBeLessThanOrEqual(1000);
  await expect(page).toHaveURL(/\/work\/1$/);
  await expect(transition).toHaveAttribute("data-active", "false");
  await expect(tunnel).toHaveAttribute("width", "1");
  await expect(tunnel).toHaveAttribute("height", "1");
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

test("losing the transition context still completes navigation and releases scrolling", async ({
  page,
}) => {
  await page.goto("/work/3");
  await page
    .getByRole("link", { name: "← 프로젝트 목록으로", exact: true })
    .click();
  const tunnel = page.locator("[data-route-tunnel]");
  await expect(tunnel).toHaveAttribute("data-ready", "true");
  await tunnel.evaluate((element) => {
    (element as HTMLCanvasElement)
      .getContext("webgl")
      ?.getExtension("WEBGL_lose_context")
      ?.loseContext();
  });
  await expect(tunnel).toHaveAttribute("data-ready", "false");
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
    .getByRole("link", { name: "Aeppy 프로젝트 보기", exact: true })
    .click();
  await expect(page).toHaveURL(/\/work\/5$/);
  await expect(page.locator("[data-route-transition]")).toHaveAttribute(
    "data-active",
    "false",
  );
});

test("reduced motion keeps direct navigation, anchors and new-tab links available", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/work/3");
  await expect(page.locator("[data-route-tunnel]")).not.toHaveAttribute(
    "data-ready",
    "true",
  );
  const transition = page.locator("[data-route-transition]");
  await expect(transition).toHaveAttribute("data-active", "false");
  await page
    .getByRole("link", { name: "← 프로젝트 목록으로", exact: true })
    .click();
  await expect(page).toHaveURL(/\/#work$/);
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
