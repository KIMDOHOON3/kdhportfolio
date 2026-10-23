import { expect, test } from "@playwright/test";

test("first gallery entrance follows heading and filters, then film and line copy", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const viewport = page.locator("[data-scroll-viewport]");
  await expect(viewport).toHaveAttribute("data-intro", "done");
  const gallery = page.locator("[data-project-gallery]");
  await expect(gallery).toHaveAttribute("data-gallery-entrance", "pending");
  await expect(page.getByRole("region", { name: "프로젝트 갤러리" })).toHaveCSS(
    "opacity",
    "0",
  );
  await gallery.evaluate((element) => {
    const log: string[] = [];
    (window as Window & { galleryPhases?: string[] }).galleryPhases = log;
    new MutationObserver(() => {
      log.push((element as HTMLElement).dataset.galleryEntrance!);
    }).observe(element, {
      attributes: true,
      attributeFilter: ["data-gallery-entrance"],
    });
    const viewport = document.querySelector("[data-scroll-viewport]")!;
    const heading = document.querySelector("#work")!;
    viewport.scrollTop += heading.getBoundingClientRect().top - 100;
  });
  await expect(gallery).toHaveAttribute("data-gallery-entrance", "film");
  await expect(page.locator("#work h2 [data-copy-reveal]")).toHaveAttribute(
    "data-copy-entrance",
    "done",
  );
  for (const filter of await page
    .getByRole("group", { name: "프로젝트 필터" })
    .getByRole("button")
    .all()) {
    await expect(filter).toHaveAttribute("data-element-state", "done");
  }
  await expect(gallery.getByRole("article")).toHaveCount(0);
  await expect(gallery).toHaveAttribute("data-gallery-entrance", "copy");
  const firstLine = gallery
    .locator("[data-selected-project] [data-gallery-reveal]")
    .first();
  expect(
    await firstLine.evaluate((element) => element.getAnimations().length),
  ).toBeGreaterThan(0);
  await expect(gallery).toHaveAttribute("data-gallery-entrance", "done");
  expect(
    await page.evaluate(
      () => (window as Window & { galleryPhases?: string[] }).galleryPhases,
    ),
  ).toEqual(["film", "copy", "done"]);
  await gallery
    .getByRole("navigation", { name: "프로젝트 바로 선택" })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("gallery-first-entry.png") });
  await page
    .getByRole("group", { name: "프로젝트 필터" })
    .getByRole("button", { name: "개인 02", exact: true })
    .click();
  await expect(gallery).toHaveAttribute("data-gallery-entrance", "done");
  expect(errors).toEqual([]);
});

test("reduced motion shows gallery immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#work");
  const gallery = page.locator("[data-project-gallery]");
  await expect(gallery).toHaveAttribute("data-gallery-entrance", "done");
  await expect(
    gallery.getByRole("region", { name: "프로젝트 갤러리" }),
  ).toHaveCSS("opacity", "1");
  expect(
    await gallery
      .locator("[data-selected-project] [data-gallery-reveal]")
      .evaluateAll((elements) =>
        elements.some((element) =>
          element
            .getAnimations()
            .some((animation) => animation.playState === "running"),
        ),
      ),
  ).toBe(false);
});
