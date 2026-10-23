import { expect, test } from "@playwright/test";
import { portfolioProjects } from "../../src/data/portfolio";

test("technology previews and full detail lists keep their content and layout", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#work");
  const gallery = page.locator("[data-project-gallery]");
  const pause = gallery.getByRole("button", {
    name: "갤러리 자동 회전 일시 정지",
  });
  if ((await pause.getAttribute("aria-pressed")) === "false")
    await pause.click();
  for (const project of portfolioProjects) {
    await gallery
      .getByRole("navigation", { name: "프로젝트 바로 선택" })
      .getByRole("button", { name: new RegExp(project.title) })
      .click();
    const information = gallery.locator("[data-selected-project]");
    await expect(information).toHaveAttribute(
      "data-selected-project",
      String(project.id),
    );
    const entries = information.locator('[class*="stackMotion"] > span');
    await expect(entries).toHaveText(project.stack.slice(0, 3));
    for (const entry of await entries.all()) await expect(entry).toBeVisible();
  }
  await gallery.locator("[data-selected-project]").scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("gallery-shared-ui.png") });
  for (const project of portfolioProjects) {
    await page.goto(`/work/${project.id}`);
    const sections = page.locator("[data-detail-section]");
    const stacks = project.phases?.map((phase) => phase.stack) ?? [
      project.stack,
    ];
    for (const [index, stack] of stacks.entries()) {
      const entries = sections
        .nth(index)
        .locator('header [class*="_stack_"] > span');
      await expect(entries).toHaveText(stack);
    }
    const actions = page.locator('[class*="_actions_"] a');
    for (const action of await actions.all()) {
      await expect(action).toHaveAttribute("target", "_blank");
      await expect(action).toHaveAttribute("rel", "noreferrer");
      await expect(action.locator("[data-button-light]")).toHaveCount(1);
      await expect(action.locator("svg")).toHaveCount(2);
    }
    expect(
      await page
        .locator("[data-scroll-viewport]")
        .evaluate((e) => e.scrollWidth - e.clientWidth),
    ).toBe(0);
  }
  await page.locator("#overview").scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("detail-shared-ui.png") });
  expect(errors).toEqual([]);
});

test("shared footer links retain native mail and PDF download behavior", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/work/5");
  const footer = page.locator("footer");
  await expect(footer.locator('a[href^="mailto:"]')).toHaveAttribute(
    "href",
    "mailto:kingyska@nate.com",
  );
  const resume = footer.getByRole("link", {
    name: "이력서 다운로드",
    exact: true,
  });
  await expect(resume).toHaveAttribute("download", "");
  const downloaded = page.waitForEvent("download");
  await resume.click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe("김도훈-이력서.pdf");
  expect(await download.failure()).toBeNull();
  await expect(page).toHaveURL(/\/work\/5$/);
  await footer.getByRole("link", { name: "맨 위로 ↑", exact: true }).click();
  await expect
    .poll(() =>
      page.locator("[data-scroll-viewport]").evaluate((e) => e.scrollTop),
    )
    .toBeLessThan(2);
});
