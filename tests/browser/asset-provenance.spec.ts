import { expect, test } from "@playwright/test";

test("retired external assets are absent and lettering has an OFL source", async ({ request, page }, info) => {
  test.skip(info.project.name !== "desktop", "Asset routes do not vary by viewport");
  const retired = [
    "/models/hello.glb", "/models/thank-you.glb",
    "/models/hello-rounded.glb", "/models/thank-you-rounded.glb",
    "/font/NewYork.woff2", "/projects/mockups/lexus-desktop.png",
    "/projects/mockups/kia-mobile.png", "/work/bg/1_1.jpg", "/icons/zustand.png",
    "/docs/internal-notes.md",
  ];
  for (const path of retired) expect((await request.get(path)).status(), path).toBe(404);
  for (const path of ["/models/hello-open.glb", "/models/thank-you-open.glb"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const bytes = await response.body();
    expect(bytes.readUInt32LE(0)).toBe(0x46546c67);
    const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString("utf8").trim());
    expect(json.scenes[0].extras).toMatchObject({ source: "Pacifico", license: "SIL OFL 1.1" });
    expect(json.images ?? []).toHaveLength(0);
  }
  await page.goto("/");
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute("data-hello-geometry", "ofl-lettering");
  await expect(page.locator("[data-glass-scene]")).toHaveAttribute("data-footer-geometry", "ofl-lettering");
  expect(await page.locator('[data-work-cover-mockup] img').count()).toBe(0);
});
