import { expect, test } from "@playwright/test";

test("presentation assets load while local documents remain excluded", async ({ request, page }, info) => {
  test.skip(info.project.name !== "desktop", "Asset routes do not vary by viewport");
  const restored = [
    "/models/hello.glb", "/models/thank-you.glb",
    "/font/NewYork.woff2", "/icons/github.svg", "/icons/react.svg", "/icons/zustand.png",
    "/projects/mockups/lexus-desktop.png", "/projects/mockups/lexus-mobile.png",
    "/projects/mockups/kia-desktop.png", "/projects/mockups/kia-mobile.png",
  ];
  for (const path of restored) expect((await request.get(path)).status(), path).toBe(200);
  expect((await request.get("/docs/internal-notes.md")).status()).toBe(404);
  await page.goto("/");
  const scene = page.locator("[data-glass-scene]");
  await expect(scene).toHaveAttribute("data-hello-geometry", "glass-mesh");
  await expect(scene).toHaveAttribute("data-footer-geometry", "glass-path");
  await expect(page.locator("header nav a").first()).toHaveCSS("font-family", /NewYork/);
  await expect.poll(() => page.locator('[data-work-cover-mockup] img').evaluateAll(
    images => images.length === 4 && images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0),
  )).toBe(true);
});
