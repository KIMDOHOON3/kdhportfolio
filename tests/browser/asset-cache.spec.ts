import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import { FONT_ASSETS, GALLERY_ASSETS } from "../../src/data/staticAssets";

test("content-addressed images and fonts return the correct bytes with immutable caching", async ({
  request,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "HTTP policy is the same at every viewport.",
  );
  for (const url of [
    ...Object.values(GALLERY_ASSETS),
    ...Object.values(FONT_ASSETS),
  ]) {
    const response = await request.get(url);
    expect(response.status(), url).toBe(200);
    expect(response.headers()["cache-control"], url).toBe(
      "public, max-age=31536000, immutable",
    );
    const hash = createHash("sha256")
      .update(await response.body())
      .digest("hex")
      .slice(0, 12);
    expect(url, "A changed file must have a changed address").toContain(
      `.${hash}.`,
    );
  }
  for (const url of ["/projects/gallery/1.webp", "/font/NewYork.woff2"]) {
    const response = await request.head(url);
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).not.toContain("immutable");
  }
});

test("repeat visits reuse gallery and font bytes from the browser cache", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const expected = [
    ...Object.values(GALLERY_ASSETS),
    FONT_ASSETS["NewYork.woff2"],
    FONT_ASSETS["Pacifico-Footer.woff2"],
    FONT_ASSETS["PortfolioSans-Regular.woff2"],
    FONT_ASSETS["PortfolioSans-Bold.woff2"],
  ];
  const legacyRequests: string[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith("/font/") || path.startsWith("/projects/gallery/"))
      legacyRequests.push(path);
  });
  const entries = () =>
    page.evaluate(
      (paths) =>
        performance
          .getEntriesByType("resource")
          .filter((entry) => paths.includes(new URL(entry.name).pathname))
          .map((entry) => {
            const resource = entry as PerformanceResourceTiming;
            return {
              url: new URL(entry.name).pathname,
              transferSize: resource.transferSize,
              decodedBodySize: resource.decodedBodySize,
            };
          }),
      expected,
    );
  const ready = async () => {
    await expect(page.locator("[data-gallery-canvas]")).toHaveAttribute(
      "data-ready",
      "true",
    );
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(async () => (await entries()).map((entry) => entry.url))
      .toEqual(expect.arrayContaining(expected));
  };
  await page.goto("/#work");
  await ready();
  const first = await entries();
  expect(first.some((entry) => entry.transferSize > 0)).toBe(true);
  await page.goto("/work/1");
  await expect(
    page.locator("[data-project-transition-cover] img"),
  ).toHaveAttribute("src", GALLERY_ASSETS[1]);
  await page.goto("/#work");
  await ready();
  const returned = await entries();
  for (const entry of returned) {
    expect(entry.decodedBodySize, entry.url).toBeGreaterThan(0);
    expect(entry.transferSize, entry.url).toBe(0);
  }
  expect(legacyRequests).toEqual([]);
  await info.attach("cached-assets", {
    body: JSON.stringify({ first, returned }, null, 2),
    contentType: "application/json",
  });
});
