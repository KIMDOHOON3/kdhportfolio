import { expect, test } from "@playwright/test";
import { GALLERY_ASSETS } from "../../src/data/staticAssets";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const uploads: string[] = [];
    Object.assign(window, { galleryUploads: uploads });
    const record = (gl: WebGL2RenderingContext, args: unknown[]) => {
      const source = args[args.length - 1];
      if (
        (gl.canvas as HTMLCanvasElement).hasAttribute(
          "data-curved-gallery-canvas",
        ) &&
        source instanceof HTMLImageElement
      )
        uploads.push(new URL(source.src).pathname);
    };
    const original = WebGL2RenderingContext.prototype.texImage2D;
    WebGL2RenderingContext.prototype.texImage2D = function (
      this: WebGL2RenderingContext,
      ...args: unknown[]
    ) {
      record(this, args);
      return Reflect.apply(original, this, args);
    };
    const subImage = WebGL2RenderingContext.prototype.texSubImage2D;
    WebGL2RenderingContext.prototype.texSubImage2D = function (
      this: WebGL2RenderingContext,
      ...args: unknown[]
    ) {
      record(this, args);
      return Reflect.apply(subImage, this, args);
    };
  });
});

const uploaded = (page: import("@playwright/test").Page) =>
  page.evaluate(
    () => (window as Window & { galleryUploads?: string[] }).galleryUploads!,
  );

test("the selected artwork draws before delayed neighbors and fills them without restarting", async ({
  page,
}, info) => {
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requests: string[] = [];
  await page.route(
    (url) => [3, 4, 5].some((id) => GALLERY_ASSETS[id] === url.pathname),
    async (route) => {
      requests.push(new URL(route.request().url()).pathname);
      await waiting;
      await route.continue();
    },
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto("/#work");
    const host = page.locator("[data-gallery-canvas]");
    await expect(host).toHaveAttribute("data-ready", "true");
    const canvas = await host.locator("canvas").elementHandle();
    await expect.poll(() => uploaded(page)).toContain(GALLERY_ASSETS[1]);
    expect([...new Set(await uploaded(page))]).toEqual([GALLERY_ASSETS[1]]);
    await expect.poll(() => requests.length).toBe(3);
    await expect(page.locator("[data-project-gallery]")).toHaveAttribute(
      "data-gallery-entrance",
      "done",
    );
    // Auto rotation must not replace this readable work with an unloaded image.
    await page.waitForTimeout(700);
    await expect(page.locator("[data-selected-project]")).toHaveAttribute(
      "data-selected-project",
      "1",
    );
    await page.screenshot({
      path: info.outputPath("selected-with-neighbors-pending.png"),
      scale: "css",
    });
    release();
    await expect.poll(async () => new Set(await uploaded(page)).size).toBe(4);
    expect(requests).toHaveLength(3);
    expect(
      await canvas!.evaluate(
        (element) =>
          element === document.querySelector("[data-gallery-canvas] canvas"),
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "다음 프로젝트", exact: true })
      .click();
    await expect(page.locator("[data-selected-project]")).toHaveAttribute(
      "data-selected-project",
      "3",
    );
    expect(errors).toEqual([]);
  } finally {
    release();
  }
});

for (const completion of ["success", "failure"] as const) {
  test(`changing filter keeps the newer gallery after the old image's ${completion}`, async ({
    page,
  }) => {
    let release!: () => void;
    let pending = 0;
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(
      (url) => url.pathname === GALLERY_ASSETS[1],
      async (route) => {
        pending++;
        await waiting;
        if (completion === "failure") await route.abort();
        else await route.continue();
      },
    );
    try {
      await page.goto("/#work");
      await expect.poll(() => pending).toBe(1);
      await page
        .getByRole("group", { name: "프로젝트 필터" })
        .getByRole("button", { name: "개인 02", exact: true })
        .click();
      const host = page.locator("[data-gallery-canvas]");
      await expect(host).toHaveAttribute("data-ready", "true");
      await expect(page.locator("[data-selected-project]")).toHaveAttribute(
        "data-selected-project",
        "5",
      );
      await expect.poll(() => uploaded(page)).toContain(GALLERY_ASSETS[5]);
      release();
      await expect.poll(() => uploaded(page)).toContain(GALLERY_ASSETS[4]);
      // Allow the old request's continuation to finish before checking ownership.
      await page.waitForTimeout(300);
      await expect(host.locator("canvas")).toHaveCount(1);
      await expect(host).toHaveAttribute("data-ready", "true");
      await expect(page.locator("[data-selected-project]")).toHaveAttribute(
        "data-selected-project",
        "5",
      );
      expect(await uploaded(page)).not.toContain(GALLERY_ASSETS[1]);
      expect(pending).toBe(1);
    } finally {
      release();
    }
  });
}

test("a failed neighboring texture does not discard the selected artwork or detail transition", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route(
    (url) => url.pathname === GALLERY_ASSETS[3],
    (route) => route.abort(),
  );
  await page.goto("/#work");
  await expect(page.locator("[data-gallery-canvas]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect.poll(() => uploaded(page)).toContain(GALLERY_ASSETS[1]);
  await page
    .getByRole("link", { name: "LEXUS 프로젝트 보기", exact: true })
    .click();
  await expect(page.locator("[data-route-transition]")).toHaveAttribute(
    "data-gallery-flight",
    "true",
  );
  await expect(page).toHaveURL(/\/work\/1$/);
  await expect(page.locator("[data-route-transition]")).toHaveAttribute(
    "data-active",
    "false",
  );
  await page.goBack();
  await expect(page.locator("[data-route-transition]")).toHaveAttribute(
    "data-active",
    "false",
  );
  await expect(page.locator("[data-gallery-canvas]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.locator("[data-selected-project]")).toHaveAttribute(
    "data-selected-project",
    "1",
  );
  expect(errors).toEqual([]);
});
