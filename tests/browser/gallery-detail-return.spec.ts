import { expect, test } from "@playwright/test";

for (const initialFilter of ["전체 04", "실무 02"]) {
  test(`returning after linked details selects the current work from ${initialFilter}`, async ({
    page,
  }) => {
    await page.goto("/#work");
    const transition = page.locator("[data-route-transition]");
    await page
      .getByRole("group", { name: "프로젝트 필터" })
      .getByRole("button", { name: initialFilter, exact: true })
      .click();
    await page
      .getByRole("link", { name: "LEXUS 프로젝트 보기", exact: true })
      .click();
    await expect(page).toHaveURL(/\/work\/1$/);
    await expect(transition).toHaveAttribute("data-active", "false");
    for (const [title, id] of [
      ["Kia Worldwide", 3],
      ["Aeppy", 5],
      ["Dog Atlas", 4],
    ] as const) {
      await page
        .getByRole("link", { name: `다음 프로젝트 ${title}`, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`/work/${id}$`));
      await expect(transition).toHaveAttribute("data-active", "false");
    }
    await page.getByRole("link", { name: /프로젝트 목록으로/ }).click();
    await expect(page).toHaveURL(/\/#work$/);
    await expect(transition).toHaveAttribute("data-active", "false");
    await expect(page.locator("[data-selected-project]")).toHaveAttribute(
      "data-selected-project",
      "4",
    );
    await expect(
      page.getByRole("button", { name: "전체 04", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page
        .getByRole("navigation", { name: "프로젝트 바로 선택" })
        .getByRole("button", { name: /Dog Atlas/ }),
    ).toHaveAttribute("aria-pressed", "true");
    const canvas = page.locator("[data-gallery-canvas]");
    await expect(canvas).toHaveAttribute("data-ready", "true");
    await expect
      .poll(() =>
        canvas.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const point = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height * 0.39,
            id: null as number | null,
          };
          element.dispatchEvent(
            new CustomEvent("gallery:hover", { detail: point }),
          );
          return point.id;
        }),
      )
      .toBe(4);
  });
}

test("a cold detail visit returns to that project without losing its selection", async ({
  page,
}) => {
  await page.goto("/work/4");
  await page.getByRole("link", { name: /프로젝트 목록으로/ }).click();
  await expect(page).toHaveURL(/\/#work$/);
  await expect(page.locator("[data-route-transition]")).toHaveAttribute(
    "data-active",
    "false",
  );
  await expect(page.locator("[data-selected-project]")).toHaveAttribute(
    "data-selected-project",
    "4",
  );
});
