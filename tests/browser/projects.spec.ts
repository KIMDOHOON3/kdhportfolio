import { expect, test } from "@playwright/test";

test("project controls roll down, retain selection and stop offscreen", async ({
  page,
}, info) => {
  test.skip(
    info.project.use.isMobile === true,
    "Hover requires a fine pointer.",
  );
  await page.goto("/#work");
  await page.evaluate(() => document.fonts.ready);
  const filters = page.getByRole("group", { name: "프로젝트 필터" });
  const work = filters.getByRole("button", { name: "실무 02" });
  await work.hover();
  await expect(work).toHaveAttribute("aria-pressed", "false");
  await expect(
    filters.getByRole("button", { name: "전체 04" }),
  ).toHaveAttribute("aria-pressed", "true");
  const letters = work.locator("[data-button-label] [aria-hidden] > span");
  await expect
    .poll(() =>
      letters
        .first()
        .evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m42),
    )
    .toBeGreaterThan(10);
  await expect(work.locator("[data-button-light]")).toHaveAttribute(
    "data-visible",
    "true",
  );
  const bounds = await work.boundingBox();
  await work.click();
  await expect(work).toHaveAttribute("aria-pressed", "true");
  expect((await work.boundingBox())!.width).toBeCloseTo(bounds!.width, 0);
  const action = page.getByRole("button", {
    name: "다음 프로젝트",
    exact: true,
  });
  await action.hover();
  await expect(action.locator("[data-button-light]")).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(letters.first()).toHaveCSS("transform", "none");
});

test("one Lexus project retains renewal and operations details", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#work");
  await page.evaluate(() => document.fonts.ready);
  const gallery = page.locator("#work");
  await expect(gallery.locator("[data-gallery-panel]")).toHaveCount(4);
  await expect(gallery.locator("[data-gallery-canvas]")).toHaveCount(1);
  await expect(gallery.locator("[data-selected-project]")).toHaveAttribute(
    "data-selected-project",
    "1",
  );
  await expect(gallery.locator("[data-selected-project] li")).toHaveText([
    "상담신청 폼·예약 달력·마이페이지 공통 LNB 개발",
    "Three.js 별 표현·이미지 시퀀스 차량 뷰어 구현",
    "시승 신청 흐름 개선·프론트엔드 일정 및 QA 조율",
  ]);
  await page
    .getByRole("button", { name: "다음 프로젝트", exact: true })
    .click();
  await expect(gallery.locator("[data-selected-project] li")).toHaveText([
    "브랜드·차량 콘텐츠 및 스크롤 인터랙션 개발",
    "이미지 로딩·iOS 헤더·Safari 영상 모션 개선",
    "이미지 파일 용량 절감·공통 컴포넌트 구조 정비",
  ]);
  const filters = gallery.getByRole("group", { name: "프로젝트 필터" });
  const capture = async (name: string) => {
    const path = info.outputPath(`${name}.png`);
    await page.screenshot({ path, scale: "css" });
    await info.attach(name, { path, contentType: "image/png" });
  };
  await capture("project-gallery");
  await filters.getByRole("button", { name: /실무/ }).click();
  await expect(gallery.locator("[data-gallery-panel]")).toHaveCount(2);
  await filters.getByRole("button", { name: /개인/ }).click();
  await expect(gallery.locator("[data-gallery-panel]")).toHaveCount(2);
  await expect(gallery.locator("[data-selected-project] h3")).toHaveText("Aeppy");
  await filters.getByRole("button", { name: /전체/ }).click();
  await page
    .getByRole("navigation", { name: "프로젝트 바로 선택" })
    .getByRole("button", { name: /LEXUS/ })
    .click();
  await gallery
    .getByRole("link", { name: "LEXUS 프로젝트 보기", exact: true })
    .click();
  await page.waitForURL("**/work/1");
  await expect(
    page.getByRole("heading", { name: "LEXUS", exact: true }),
  ).toBeVisible();
  await capture("lexus-summary");
  await expect(
    page.locator("[data-project-transition-cover] img"),
  ).toBeVisible();
  await expect(
    page.locator('meta[property="og:image"][content*="lexus-renewal"]'),
  ).toHaveCount(0);
  const renewal = page.getByRole("region", {
    name: "웹사이트 리뉴얼",
    exact: true,
  });
  const operations = page.getByRole("region", {
    name: "운영 · 기능 개선",
    exact: true,
  });
  await expect(renewal.locator("article")).toHaveCount(5);
  await expect(operations.locator("article")).toHaveCount(3);
  await expect(page.locator("[data-project-overview] dl")).toContainText(
    "운영 2026.04–10",
  );
  await expect(page.locator("[data-project-overview] dl")).toContainText(
    "리뉴얼 2026.05–10",
  );
  await expect(renewal).toContainText("2026.05–10");
  await expect(renewal).toContainText("수동으로 확인했습니다");
  await expect(operations).toContainText("2026.04–10");
  await expect(operations.locator("article").first().locator("dt")).toHaveText([
    "문제",
    "재현",
    "원인 확인",
    "수정",
  ]);
  await expect(operations.locator("article").nth(1)).toContainText(
    "기획팀과 기존 정책·변경 이력",
  );
  await expect(page.locator("main")).not.toContainText("신청 흐름 검증 테스트");
  await expect(page.locator("main")).not.toContainText("오래된 비동기 응답");
  await expect(renewal.getByText("React", { exact: true })).toBeVisible();
  await expect(operations.getByText("Vue 2", { exact: true })).toBeVisible();
  await expect(
    operations.getByRole("heading", {
      name: "이미지 시퀀스 기반 360° 차량 뷰어",
      exact: true,
    }),
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
