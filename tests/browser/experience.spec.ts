import { expect, test } from "@playwright/test";

test("rolling skills remain above the chronological career and anchors stay readable", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#about");
  const journey = page.locator("[data-journey]");
  const viewport = page.locator("[data-scroll-viewport]");
  await expect(journey).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => document.fonts.ready);
  const height = page.viewportSize()!.height;
  const start = await journey.evaluate(
    (e) =>
      e.getBoundingClientRect().top +
      document.querySelector("[data-scroll-viewport]")!.scrollTop,
  );
  await viewport.evaluate(
    (e, top) => (e.scrollTop = top),
    start + height * 0.72,
  );
  await expect(journey).toHaveAttribute("data-entered", "true");
  const content = page.locator("[data-journey-page]");
  const skills = content.locator("[data-journey-skills]");
  const track = skills.locator("[data-skills-track]");
  const list = skills.locator('ul:not([aria-hidden="true"])');
  await expect(list.locator("li")).toHaveCount(15);
  for (const skill of [
    "HTML",
    "CSS",
    "JavaScript",
    "jQuery",
    "React",
    "Next.js",
    "TypeScript",
    "Emotion",
    "SCSS",
    "Zustand",
    "Vercel",
  ])
    await expect(list.getByText(skill, { exact: true })).toHaveCount(1);
  await page.mouse.move(2, height - 2);
  const initial = await track.evaluate((e) => getComputedStyle(e).transform);
  await expect
    .poll(() => track.evaluate((e) => getComputedStyle(e).transform))
    .not.toBe(initial);
  const pause = skills.getByRole("button", { name: "스킬 롤링 일시 정지" });
  await pause.click();
  await expect(
    skills.getByRole("button", { name: "스킬 롤링 재생" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(track).toHaveCSS("animation-play-state", "paused");
  await skills.getByRole("button", { name: "스킬 롤링 재생" }).click();
  await page.mouse.move(2, height - 2);
  await expect(track).toHaveCSS("animation-play-state", "running");
  const chapters = content.locator("[data-journey-chapter]");
  await expect(chapters).toHaveCount(5);
  for (const [index, title] of [
    "한경대학교",
    "SBS아카데미",
    "언제나 디자인",
    "코드잇 스프린트",
    "렉서스·기아",
  ].entries())
    await expect(chapters.nth(index)).toContainText(title);
  await expect(chapters.nth(2)).not.toContainText("2022.07 — 2023.10");
  await expect(chapters.nth(3)).not.toContainText("2024.08 — 2025.02");
  const navigation = page.getByRole("navigation", {
    name: "성장 과정 바로가기",
  });
  for (const id of ["2022", "2024", "now"]) {
    const link = navigation.locator(`a[href="#journey-${id}"]`);
    await link.click();
    const chapter = page.locator(`#journey-${id}`);
    await expect
      .poll(() =>
        chapter.evaluate((e) =>
          Math.abs(
            e.getBoundingClientRect().top -
              parseFloat(getComputedStyle(e).scrollMarginTop),
          ),
        ),
      )
      .toBeLessThan(3);
    await expect(link).toHaveAttribute("aria-current", "step");
    const dock = (await skills.boundingBox())!;
    const header = (await page.locator("header").boundingBox())!;
    const heading = (await chapter.getByRole("heading").boundingBox())!;
    expect(dock.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
    expect(heading.y).toBeGreaterThan(dock.y + dock.height);
    expect(heading.x).toBeGreaterThanOrEqual(0);
    expect(heading.x + heading.width).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
  }
  const resume = content.getByRole("link", { name: "이력서 내려받기" });
  await expect(resume).toHaveAttribute("download", "");
  expect(
    (await page.request.get((await resume.getAttribute("href"))!)).ok(),
  ).toBe(true);
  expect(await viewport.evaluate((e) => e.scrollWidth - e.clientWidth)).toBe(0);
  expect(errors).toEqual([]);
  const path = info.outputPath("journey-current-work.png");
  await page.screenshot({ path, scale: "css" });
  await info.attach("journey-current-work", { path, contentType: "image/png" });
});
