import { expect, test } from "@playwright/test";

test("gallery cursor follows the image, yields to dragging and preserves touch and keyboard links", async ({
  page,
}, info) => {
  await page.goto("/#work");
  await expect(page.locator("[data-gallery-canvas]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page
    .getByRole("button", { name: "갤러리 자동 회전 일시 정지" })
    .click();
  const stage = page.getByRole("region", { name: "프로젝트 갤러리" });
  const cursor = page.locator("[data-gallery-pointer]");
  const link = page.getByRole("link", {
    name: "LEXUS 프로젝트 보기",
    exact: true,
  });
  if (info.project.use.isMobile) {
    await expect(cursor).toHaveCSS("display", "none");
    await expect(link).toHaveCSS("opacity", "1");
    await link.click();
    await expect(page).toHaveURL(/\/work\/1$/);
    return;
  }
  await expect(link).toHaveCSS("opacity", "0");
  const box = (await stage.boundingBox())!;
  const first = { x: box.width * 0.36, y: box.y + box.height * 0.4 };
  const second = { x: box.width * 0.65, y: box.y + box.height * 0.36 };
  await page.mouse.move(first.x, first.y);
  await expect(cursor).toHaveAttribute("data-active", "true");
  await page.mouse.move(second.x, second.y);
  await expect
    .poll(async () => {
      const rect = (await cursor.boundingBox())!;
      return (
        Math.abs(rect.x + rect.width / 2 - second.x) +
        Math.abs(rect.y + rect.height / 2 - second.y)
      );
    })
    .toBeLessThan(2);
  await page.mouse.move(second.x, box.y + box.height - 3);
  await expect(cursor).not.toHaveAttribute("data-active", "true");
  await page.mouse.move(first.x, first.y);
  await expect(cursor).toHaveAttribute("data-active", "true");
  await page.mouse.down();
  await page.mouse.move(first.x - 55, first.y, { steps: 6 });
  await expect(cursor).not.toHaveAttribute("data-active", "true");
  await page.mouse.up();
  await expect(page).toHaveURL(/\/#work$/);
  await stage.focus();
  await page.keyboard.press("Tab");
  await expect(link).toBeFocused();
  await expect(link).toHaveCSS("opacity", "1");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/work\/1$/);
});
