import { expect, test } from "@playwright/test";

test("responsive rows enter left to right and buttons pop without changing layout", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    const starts: {
      label: string;
      at: number;
      scales?: unknown[];
      duration?: number | string;
    }[] = [];
    (
      window as typeof window & { entranceStarts: typeof starts }
    ).entranceStarts = starts;
    document.addEventListener("animationstart", (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest("#work")) return;
      if (
        !target.matches(
          "[data-copy-reveal], [data-element-reveal], [data-paper-cover]",
        )
      )
        return;
      starts.push({
        label:
          target.getAttribute("aria-label") ??
          (target.matches("[data-paper-cover]")
            ? "image"
            : (target.textContent?.trim() ?? "")),
        at: performance.now(),
        scales: (
          target.getAnimations()[0]?.effect as KeyframeEffect | undefined
        )
          ?.getKeyframes()
          .map((frame) => frame.scale),
        duration: Number(
          target.getAnimations()[0]?.effect?.getTiming().duration,
        ),
      });
    });
  });
  await page.goto("/#work");
  const filters = page.getByRole("group", { name: "프로젝트 필터" });
  await expect(
    filters.getByRole("button", { name: "개인 02", exact: true }),
  ).toHaveAttribute("data-element-state", "done");
  const firstCard = page.locator("#work article").first();
  await expect(firstCard.locator("h3 [data-copy-reveal]")).toHaveAttribute(
    "data-copy-entrance",
    "done",
  );
  const starts = await page.evaluate(
    () =>
      (
        window as typeof window & {
          entranceStarts: { label: string; at: number }[];
        }
      ).entranceStarts,
  );
  const order = [
    "프로젝트",
    "전체 04",
    "실무 02",
    "개인 02",
    "01 실무 프로젝트",
    "2026",
    "LEXUS",
  ];
  const indices = order.map((label) =>
    starts.findIndex((entry) => entry.label === label),
  );
  expect(indices.every((index) => index >= 0)).toBe(true);
  expect(indices).toEqual([...indices].sort((a, b) => a - b));

  const motion = await page.evaluate(
    () =>
      (
        window as typeof window & {
          entranceStarts: {
            label: string;
            scales?: unknown[];
            duration?: number | string;
          }[];
        }
      ).entranceStarts.find((entry) => entry.label === "전체 04")!,
  );
  expect(motion.scales).toEqual(["0", "1.035", "1"]);
  expect(motion.duration).toBe(480);
  await firstCard.locator("[data-cover-entrance]").scrollIntoViewIfNeeded();
  await expect(firstCard.locator("[data-cover-entrance]")).toHaveAttribute(
    "data-cover-entrance",
    "done",
  );
  await firstCard
    .locator("[data-project-action]")
    .evaluate((element) => element.scrollIntoView({ block: "center" }));
  await expect(firstCard.locator("[data-project-action]")).toHaveAttribute(
    "data-element-state",
    "done",
  );
  await firstCard
    .locator("[data-entrance-after-cover]")
    .evaluate((element) => element.scrollIntoView({ block: "center" }));
  await expect(
    firstCard
      .locator("[data-entrance-after-cover] [data-element-reveal]")
      .last(),
  ).toHaveAttribute("data-element-state", "done");
  await page.screenshot({
    path: info.outputPath("responsive-sequence.png"),
    scale: "css",
  });
});
