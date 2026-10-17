import { expect, test, type Page, type TestInfo } from "@playwright/test";

async function capture(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(`${name}.png`);
  const bytes = await page.screenshot({ path, scale: "css" });
  await info.attach(name, { path, contentType: "image/png" });
  return bytes.toString("base64");
}

// Compare rendered pixels in the light band above the lettering. Normal idle
// drift provides a control; the pointer must change the backdrop, not just tilt
// the 3D object. No pixel equality between different sites/content is assumed.
async function lightDifference(page: Page, a: string, b: string) {
  return page.evaluate(
    async ({ a, b }) => {
      const decode = async (data: string) => {
        const blob = await (
          await fetch(`data:image/png;base64,${data}`)
        ).blob();
        const image = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(image.width, image.height);
        const context = canvas.getContext("2d")!;
        context.drawImage(image, 0, 0);
        image.close();
        return context.getImageData(0, 0, canvas.width, canvas.height);
      };
      const [left, right] = await Promise.all([decode(a), decode(b)]);
      let sum = 0,
        count = 0;
      for (
        let y = Math.floor(left.height * 0.19);
        y < left.height * 0.25;
        y++
      ) {
        for (let x = Math.floor(left.width * 0.2); x < left.width * 0.8; x++) {
          const index = (y * left.width + x) * 4;
          for (let c = 0; c < 3; c++) {
            sum += Math.abs(left.data[index + c] - right.data[index + c]);
            count++;
          }
        }
      }
      return sum / count;
    },
    { a, b },
  );
}

test("hero: pointer bends light, settles and preserves touch/reduced motion", async ({
  page,
  context,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /THREE|shader|WebGL/i.test(message.text())
    )
      errors.push(message.text());
  });
  const targets = [{ page, name: "portfolio", url: "/" }];
  const metrics: object[] = [];
  for (const target of targets) {
    const p = target.page;
    await p.goto(target.url);
    await p.evaluate(() => document.fonts.ready);
    if (target.name === "portfolio") {
      await expect(p.locator("[data-glass-scene]")).toHaveAttribute(
        "data-ready",
        "true",
      );
      await expect(p.locator("[data-story-backdrop]")).toHaveAttribute(
        "data-ready",
        "true",
      );
    } else {
      await p.locator(".lenis").waitFor();
      await p.waitForTimeout(2500);
    }
    const { width, height } = p.viewportSize()!;
    await p.mouse.move(width * 0.18, height * 0.22);
    await p.waitForTimeout(800);
    const before = await capture(p, info, `${target.name}-material-idle`);
    await p.waitForTimeout(120);
    const control = await capture(p, info, `${target.name}-material-control`);
    for (let i = 0; i < 14; i++) {
      await p.mouse.move(
        width * (0.2 + i * 0.045),
        height * (0.22 + Math.sin(i * 0.8) * 0.055),
      );
    }
    if (target.name === "portfolio") {
      await expect
        .poll(async () =>
          Number(
            await p
              .locator("[data-glass-scene]")
              .getAttribute("data-pointer-energy"),
          ),
        )
        .toBeGreaterThan(0.05);
    }
    const active = await capture(p, info, `${target.name}-material-pointer`);
    const idleDifference = await lightDifference(p, before, control);
    const pointerDifference = await lightDifference(p, control, active);
    // Desktop has a large uncovered band. On touch layouts the text and model
    // occupy this area, so the local effect is instead checked by touch below.
    if (target.name === "portfolio" && info.project.name === "desktop") {
      expect(pointerDifference).toBeGreaterThan(0.1);
      expect(pointerDifference).toBeGreaterThan(idleDifference * 1.5);
    }
    metrics.push({
      site: target.name,
      idleDifference,
      pointerDifference,
      viewport: p.viewportSize(),
    });
    if (target.name === "portfolio") {
      await expect
        .poll(
          async () =>
            Number(
              await p
                .locator("[data-glass-scene]")
                .getAttribute("data-pointer-energy"),
            ),
          { timeout: 5000 },
        )
        .toBeLessThan(0.01);
      if (info.project.use.hasTouch) {
        await p.touchscreen.tap(width * 0.5, height * 0.3);
        await expect
          .poll(async () =>
            Number(
              await p
                .locator("[data-glass-scene]")
                .getAttribute("data-pointer-energy"),
            ),
          )
          .toBeLessThan(0.01);
      }
      await p.emulateMedia({ reducedMotion: "reduce" });
      await p.mouse.move(width * 0.2, height * 0.2);
      await p.mouse.move(width * 0.8, height * 0.3);
      await expect
        .poll(async () =>
          Number(
            await p
              .locator("[data-glass-scene]")
              .getAttribute("data-pointer-energy"),
          ),
        )
        .toBe(0);
      await expect(p.locator("[data-story-backdrop]")).toHaveCSS(
        "display",
        "none",
      );
    }
  }
  await info.attach("material-metrics", {
    body: JSON.stringify(metrics, null, 2),
    contentType: "application/json",
  });
  expect(errors).toEqual([]);
});
