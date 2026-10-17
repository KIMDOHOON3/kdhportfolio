import { expect, test } from "@playwright/test";

test("one Lexus project retains renewal and operations details", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#work");
  await page.evaluate(() => document.fonts.ready);
  const gallery = page.locator("#work");
  await expect(gallery.locator("article")).toHaveCount(4);
  await expect(
    gallery.getByRole("link", { name: "LEXUS 프로젝트 보기", exact: true }),
  ).toHaveCount(1);
  await expect(gallery.locator('a[href="/work/2"]')).toHaveCount(0);
  await expect(gallery.getByRole("heading", { level: 3 })).toHaveText([
    "LEXUS",
    "Kia Worldwide",
    "Dog Atlas",
    "Aeppy",
  ]);
  await expect(page.locator("#main-navigation sup")).toHaveText("04");
  const filters = gallery.getByRole("group", { name: "프로젝트 필터" });
  await expect(filters.getByRole("button").locator("span")).toHaveText([
    "04",
    "02",
    "02",
  ]);
  const capture = async (name: string) => {
    const path = info.outputPath(`${name}.png`);
    await page.screenshot({ path, scale: "css" });
    await info.attach(name, { path, contentType: "image/png" });
  };
  await capture("four-projects");
  await filters.getByRole("button", { name: /실무/ }).click();
  await expect(gallery.locator("article")).toHaveCount(2);
  await expect(gallery.getByRole("heading", { level: 3 })).toHaveText([
    "LEXUS",
    "Kia Worldwide",
  ]);
  await filters.getByRole("button", { name: /개인/ }).click();
  await expect(gallery.getByRole("heading", { level: 3 })).toHaveText([
    "Dog Atlas",
    "Aeppy",
  ]);
  await filters.getByRole("button", { name: /전체/ }).click();
  await gallery
    .getByRole("link", { name: "LEXUS 프로젝트 보기", exact: true })
    .click();
  await page.waitForURL("**/work/1");
  await expect(
    page.getByRole("heading", { name: "LEXUS", exact: true }),
  ).toBeVisible();
  await capture("lexus-summary");
  const renewal = page.getByRole("region", {
    name: "웹사이트 리뉴얼",
    exact: true,
  });
  const operations = page.getByRole("region", {
    name: "운영 · 기능 개선",
    exact: true,
  });
  await expect(renewal.locator("article")).toHaveCount(3);
  await expect(operations.locator("article")).toHaveCount(3);
  await expect(renewal.getByText("React", { exact: true })).toBeVisible();
  await expect(operations.getByText("Vue 2", { exact: true })).toBeVisible();
  await expect(
    operations.getByRole("heading", { name: "360° 차량 뷰어", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "렉서스 작업 구분" })
    .getByRole("link", { name: "운영 · 기능 개선" })
    .click();
  await expect
    .poll(async () =>
      Math.abs(
        await operations.evaluate(
          (element) =>
            element.getBoundingClientRect().top -
            parseFloat(getComputedStyle(element).scrollMarginTop),
        ),
      ),
    )
    .toBeLessThan(3);
  await capture("lexus-operations");
  await expect(page.locator("[data-scroll-viewport]")).not.toHaveClass(
    /lenis-scrolling/,
  );
  // Use keyboard navigation for the return link above the viewport, so the
  // browser's automatic pointer scrolling does not fight the smooth scroller.
  await page
    .getByRole("navigation", { name: "렉서스 작업 구분" })
    .getByRole("link", { name: "웹사이트 리뉴얼" })
    .press("Enter");
  await expect
    .poll(async () =>
      Math.abs(
        await renewal.evaluate(
          (element) =>
            element.getBoundingClientRect().top -
            parseFloat(getComputedStyle(element).scrollMarginTop),
        ),
      ),
    )
    .toBeLessThan(3);
  await capture("lexus-renewal");
  await expect(
    page.getByRole("link", { name: /다음 프로젝트 Kia Worldwide/ }),
  ).toHaveAttribute("href", "/work/3");
  expect(
    await page
      .locator("[data-scroll-viewport]")
      .evaluate((element) => element.scrollWidth - element.clientWidth),
  ).toBe(0);
  const oldRoute = await page.request.get("/work/2", { maxRedirects: 0 });
  expect(oldRoute.status()).toBe(308);
  expect(oldRoute.headers().location).toBe("/work/1#operations");
  await page.goto("/work/2");
  await page.waitForURL("**/work/1#operations");
  await expect
    .poll(async () =>
      Math.abs(
        await operations.evaluate(
          (element) =>
            element.getBoundingClientRect().top -
            parseFloat(getComputedStyle(element).scrollMarginTop),
        ),
      ),
    )
    .toBeLessThan(3);
  await expect(
    operations.getByRole("heading", { name: "운영 · 기능 개선", exact: true }),
  ).toBeInViewport();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("navigation", { name: "렉서스 작업 구분" })
    .getByRole("link", { name: "웹사이트 리뉴얼" })
    .press("Enter");
  await expect
    .poll(async () =>
      Math.abs(
        await renewal.evaluate(
          (element) =>
            element.getBoundingClientRect().top -
            parseFloat(getComputedStyle(element).scrollMarginTop),
        ),
      ),
    )
    .toBeLessThan(3);
  expect(errors).toEqual([]);
});
