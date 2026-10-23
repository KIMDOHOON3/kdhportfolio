import { expect, test } from "@playwright/test";
import { GALLERY_ASSETS } from "../../src/data/staticAssets";

test("presentation assets load while local documents remain excluded", async ({
  request,
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Asset routes do not vary by viewport",
  );
  const restored = [
    "/models/hello.glb",
    "/models/thank-you.glb",
    "/font/NewYork.woff2",
    "/icons/github.svg",
    "/icons/react.svg",
    "/icons/zustand.png",
    ...Object.values(GALLERY_ASSETS),
  ];
  for (const path of restored)
    expect((await request.get(path)).status(), path).toBe(200);
  expect((await request.get("/docs/internal-notes.md")).status()).toBe(404);
  await page.goto("/");
  const scene = page.locator("[data-glass-scene]");
  await expect(scene).toHaveAttribute("data-hello-geometry", "glass-mesh");
  await expect(page.locator("header nav a").first()).toHaveCSS(
    "font-family",
    /NewYork/,
  );
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
  await page.locator("#work").scrollIntoViewIfNeeded();
  await expect(page.locator("[data-gallery-canvas]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect
    .poll(() =>
      page
        .locator("[data-project-gallery] img")
        .evaluateAll(
          (images) =>
            images.length > 0 &&
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
        ),
    )
    .toBe(true);
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
  await page.mouse.wheel(0, 100000);
  await expect(scene).toHaveAttribute("data-footer-geometry", "glass-path");
});
