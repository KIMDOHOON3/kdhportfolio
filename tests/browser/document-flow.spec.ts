import { expect, test } from "@playwright/test";

test("hero, background transition, about and gallery remain in document flow", async ({
  page,
}, info) => {
  const height = page.viewportSize()!.height;
  const cases = [{ name: "portfolio", url: "/" }];
  for (const target of cases) {
    const local = target.name === "portfolio";
    await page.goto(target.url);
    const selector = local ? "[data-scroll-viewport]" : ".lenis";
    await page
      .locator(local ? '[data-scroll-story][data-enhanced="true"]' : ".sticky")
      .waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(page.viewportSize()!.width * 0.65, height * 0.5);
    await expect
      .poll(
        async () => {
          const y = await page.locator(selector).evaluate((e) => e.scrollTop);
          if (y < 10) await page.mouse.wheel(0, 60);
          return y;
        },
        { timeout: 20000 },
      )
      .toBeGreaterThan(10);
    const metrics = await page.evaluate((isLocal) => {
      const v = document.querySelector(
        isLocal ? "[data-scroll-viewport]" : ".lenis",
      )!;
      const content = isLocal
        ? document.querySelector("main")!
        : v.firstElementChild!;
      const regions = isLocal
        ? [
            document.querySelector("#home")!,
            document.querySelector("#about")!,
            document.querySelector("#work")!,
          ]
        : [...content.children].slice(0, 3);
      const rect = (e: Element) => {
        const r = e.getBoundingClientRect();
        return {
          top: r.top + v.scrollTop,
          bottom: r.bottom + v.scrollTop,
          left: r.left,
          right: r.right,
          height: r.height,
        };
      };
      return {
        sections: regions.map(rect),
        cards: [
          ...document.querySelectorAll(
            isLocal ? "#work article" : "#selected-work article",
          ),
        ].map(rect),
      };
    }, local);
    expect(metrics.sections[0].height).toBe(height);
    for (let i = 1; i < metrics.sections.length; i++)
      expect(
        Math.abs(metrics.sections[i].top - metrics.sections[i - 1].bottom),
      ).toBeLessThan(1.5);
    for (let i = 0; i < metrics.cards.length; i++)
      for (let j = i + 1; j < metrics.cards.length; j++) {
        const a = metrics.cards[i],
          b = metrics.cards[j];
        expect(
          Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
            Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)),
        ).toBe(0);
      }
    await info.attach(`${target.name}-document-metrics`, {
      body: JSON.stringify(metrics, null, 2),
      contentType: "application/json",
    });
    for (const [name, y] of [
      ["hero", 0],
      ["dots", Math.round(height * 0.4)],
      ["about", height],
      ["gallery", Math.round(metrics.sections[2].top)],
    ] as const) {
      const current = await page.locator(selector).evaluate((e) => e.scrollTop);
      const scale = await page.evaluate(() =>
        navigator.maxTouchPoints > 0 ? devicePixelRatio : 1,
      );
      await page.mouse.wheel(
        0,
        name === "hero" ? -100000 : (y - current) * scale,
      );
      let corrections = 0;
      await expect
        .poll(async () => {
          let actual = await page
            .locator(selector)
            .evaluate((e) => e.scrollTop);
          if (Math.abs(actual - y) > 4 && corrections < 3) {
            // Let Lenis finish its previous input before correcting a target.
            await page.waitForTimeout(750);
            actual = await page.locator(selector).evaluate((e) => e.scrollTop);
            if (Math.abs(actual - y) > 4) {
              await page.mouse.wheel(0, (y - actual) * scale);
              corrections++;
            }
          }
          // Passing through the target is not the same as stopping there.
          // Recheck after the settle window before accepting the position.
          const beforeSettle = await page
            .locator(selector)
            .evaluate((e) => e.scrollTop);
          await page.waitForTimeout(250);
          const settled = await page
            .locator(selector)
            .evaluate((e) => e.scrollTop);
          if (Math.abs(settled - beforeSettle) > 0.5) return Infinity;
          return Math.abs(settled - y);
        })
        .toBeLessThanOrEqual(4);
      const frame = await page.evaluate((isLocal) => {
        const v = document.querySelector(
          isLocal ? "[data-scroll-viewport]" : ".lenis",
        )!;
        const hero = isLocal
          ? document.querySelector("#home")!
          : v.firstElementChild!.firstElementChild!;
        return {
          top: hero.getBoundingClientRect().top,
          body: window.scrollY,
          overflow: v.scrollWidth - v.clientWidth,
          scroll: v.scrollTop,
          progress: document.querySelector<HTMLElement>(
            "[data-background-screen]",
          )?.dataset.progress,
        };
      }, local);
      expect(frame.body).toBe(0);
      expect(frame.overflow).toBe(0);
      expect(Math.abs(frame.top + y)).toBeLessThanOrEqual(4);
      if (local && name === "dots")
        expect(Number(frame.progress)).toBeCloseTo(
          frame.scroll / (height * 0.75),
          3,
        );
      const path = info.outputPath(`${target.name}-${name}.png`);
      await page.screenshot({ path, scale: "css" });
      await info.attach(`${target.name}-${name}`, {
        path,
        contentType: "image/png",
      });
    }
  }
});
