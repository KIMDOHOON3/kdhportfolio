import { expect, test } from "@playwright/test";

test("rounded thank-you glass has visible cursor response and a clean mobile layout", async ({
  page,
}, info) => {
  await page.goto("/#contact");
  await page.evaluate(() => document.fonts.ready);
  const scene = page.locator("[data-glass-scene]");
  const heading = page.locator("[data-footer-thanks]");
  await expect(scene).toHaveAttribute("data-footer-geometry", "ofl-lettering");
  await expect(heading).toHaveAttribute("data-glass-ready", "true");
  await expect(scene).toHaveAttribute("data-scene", "thank-you");
  const { width, height } = page.viewportSize()!;
  const rect = (await heading.boundingBox())!;
  expect(Math.abs(rect.x + rect.width / 2 - width / 2)).toBeLessThan(1.5);
  const capture = async (name: string) => {
    const path = info.outputPath(`${name}.png`);
    const bytes = await page.screenshot({ path, scale: "css" });
    await info.attach(name, { path, contentType: "image/png" });
    return bytes.toString("base64");
  };
  if (info.project.use.hasTouch) {
    await page.touchscreen.tap(width * 0.5, height * 0.45);
    await expect(scene).toHaveAttribute("data-pointer-energy", "0.000");
    await capture("rounded-mobile-glass");
    return;
  }
  await page.mouse.move(width * 0.2, rect.y + rect.height * 0.6);
  await page.waitForTimeout(700);
  const before = await capture("rounded-reflection-left");
  await page.waitForTimeout(100);
  const control = await capture("rounded-reflection-idle-control");
  for (let i = 0; i < 24; i++)
    await page.mouse.move(
      width * (0.2 + i * 0.025),
      rect.y + rect.height * (0.5 + Math.sin(i * 0.5) * 0.3),
    );
  await expect
    .poll(async () => Number(await scene.getAttribute("data-pointer-energy")))
    .toBeGreaterThan(0.05);
  // The input energy is recorded before the smoothed light and rotation are
  // painted. Capture after two rendering frames, rather than racing that paint.
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
  const active = await capture("rounded-reflection-cursor-flow");
  const difference = await page.evaluate(
    async ({ a, b, c, rect }) => {
      const decode = async (data: string) => {
        const image = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${data}`)).blob(),
        );
        const canvas = new OffscreenCanvas(image.width, image.height);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(image, 0, 0);
        image.close();
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
      };
      const images = await Promise.all([a, b, c].map(decode));
      const compare = (left: ImageData, right: ImageData) => {
        let total = 0,
          changed = 0,
          count = 0;
        const differences: number[] = [];
        for (let y = Math.ceil(rect.y); y < rect.y + rect.height; y++)
          for (let x = Math.ceil(rect.x); x < rect.x + rect.width; x++) {
            const i = (y * left.width + x) * 4;
            const delta =
              Math.abs(left.data[i] - right.data[i]) +
              Math.abs(left.data[i + 1] - right.data[i + 1]) +
              Math.abs(left.data[i + 2] - right.data[i + 2]);
            total += delta / 3;
            differences.push(delta / 3);
            if (delta > 30) changed++;
            count++;
          }
        differences.sort((a, b) => a - b);
        return {
          mean: total / count,
          changedShare: changed / count,
          p99: differences[Math.floor(differences.length * 0.99)],
        };
      };
      return {
        idle: compare(images[0], images[1]),
        active: compare(images[1], images[2]),
      };
    },
    { a: before, b: control, c: active, rect },
  );
  await info.attach("rounded-reflection-metrics", {
    body: JSON.stringify(difference, null, 2),
    contentType: "application/json",
  });
  // Compare response strength and area with the idle control. A fixed share
  // of the heading box also measures whitespace; p99 independently requires
  // visible contrast over at least 1% of the box.
  expect(difference.active.mean).toBeGreaterThan(difference.idle.mean * 2);
  expect(difference.active.changedShare).toBeGreaterThan(difference.idle.changedShare * 2);
  expect(difference.active.p99).toBeGreaterThan(20);
  await page.waitForTimeout(1200);
  await capture("rounded-reflection-settling");
});
