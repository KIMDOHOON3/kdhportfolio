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
  await expect(gallery.locator("[data-work-cover-mockup]")).toHaveCount(2);
  await expect(gallery.locator('[data-work-cover-mockup] [data-project-screen]')).toHaveCount(4);
  await expect(gallery.locator('[data-work-cover-mockup] img')).toHaveCount(0);
  await expect(gallery.locator('img[src*="lexus-renewal"], img[src*="kia-worldwide"]')).toHaveCount(0);
  if (page.viewportSize()!.width > 760) {
    const cards = await gallery.locator("article").evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, left: rect.left, right: rect.right, width: rect.width };
      }),
    );
    expect(Math.abs(cards[0].top - cards[1].top)).toBeLessThan(1);
    expect(Math.abs(cards[2].top - cards[3].top)).toBeLessThan(1);
    expect(cards[2].top).toBeGreaterThan(cards[0].top);
    expect(cards[1].left).toBeGreaterThan(cards[0].right);
    expect(Math.abs(cards[0].left - cards[2].left)).toBeLessThan(1);
    expect(Math.abs(cards[1].left - cards[3].left)).toBeLessThan(1);
    cards.forEach((card) => expect(Math.abs(card.width - cards[0].width)).toBeLessThan(1));
  }
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
  const sectionOrder = await page.locator("main#top > section").evaluateAll(
    sections => sections.slice(0, 3).map(section => section.id),
  );
  expect(sectionOrder).toEqual(["home", "work", "about"]);
  const lexus = gallery.locator('a[href="/work/1"]');
  const kia = gallery.locator('a[href="/work/3"]');
  await expect(lexus.getByRole("listitem")).toHaveText([
    "상담·예약·마이페이지 UI 개발", "상담 API·인증 연동 및 폼 검증", "360° 차량 뷰어·공통 UI 개선",
  ]);
  await expect(kia.getByRole("listitem")).toHaveText([
    "브랜드 페이지·스크롤 인터랙션 구현", "차량 슬라이더·공통 컴포넌트 구현", "Safari 등 브라우저별 화면·동작 조율",
  ]);
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
  await expect(page.locator('[data-work-cover-mockup="lexus"]')).toBeVisible();
  await expect(page.locator('meta[property="og:image"][content*="lexus-renewal"]')).toHaveCount(0);
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
