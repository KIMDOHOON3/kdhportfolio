import { expect, test } from "@playwright/test";

test("static fallback keeps every project reachable without JavaScript", async ({
  browser,
}, info) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: info.project.use.viewport,
  });
  const page = await context.newPage();
  await page.goto(
    `${process.env.PORTFOLIO_URL ?? "http://localhost:3011"}/#work`,
  );
  const links = page
    .getByRole("navigation", { name: "프로젝트 상세 목록" })
    .getByRole("link");
  await expect(links).toHaveText([
    "LEXUS ↗",
    "Kia Worldwide ↗",
    "Aeppy ↗",
    "Dog Atlas ↗",
  ]);
  await links.nth(2).click();
  await expect(page).toHaveURL(/\/work\/5$/);
  await context.close();
});

test("gallery controls, keyboard and filters keep the selected image and description together", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#work");
  await expect(page.locator("[data-scroll-viewport]")).toHaveAttribute(
    "data-intro",
    "done",
  );
  const gallery = page.locator("[data-project-gallery]");
  const selection = gallery.locator("[data-selected-project]");
  const stage = page.getByRole("region", { name: "프로젝트 갤러리" });
  await expect(gallery.locator("[data-gallery-panel]")).toHaveCount(4);
  await page
    .getByRole("button", { name: "다음 프로젝트", exact: true })
    .click();
  await expect(selection).toHaveAttribute("data-selected-project", "3");
  await expect(
    gallery.locator("[data-gallery-panel][data-active=true]"),
  ).toHaveAttribute("data-gallery-panel", "3");
  await stage.focus();
  await page.keyboard.press("ArrowRight");
  await expect(selection).toHaveAttribute("data-selected-project", "5");
  await page.keyboard.press("ArrowLeft");
  await expect(selection).toHaveAttribute("data-selected-project", "3");
  await gallery
    .getByRole("navigation")
    .getByRole("button", { name: /Dog Atlas/ })
    .click();
  await expect(selection).toHaveAttribute("data-selected-project", "4");
  await expect(selection.locator("li")).toHaveCount(3);
  const filters = page.getByRole("group", { name: "프로젝트 필터" });
  await filters.getByRole("button", { name: "개인 02", exact: true }).click();
  await expect(selection).toHaveAttribute("data-selected-project", "4");
  await expect(gallery.locator("[data-gallery-panel]")).toHaveCount(2);
  await expect(gallery.getByRole("button", { name: /LEXUS 선택/ })).toHaveCount(
    0,
  );
  expect(
    await page
      .locator("[data-scroll-viewport]")
      .evaluate((e) => e.scrollWidth - e.clientWidth),
  ).toBe(0);
  expect(errors).toEqual([]);
});

test("dragging selects a work without following its link, and vertical touch still scrolls", async ({
  page,
}, info) => {
  await page.goto("/#work");
  const viewport = page.locator("[data-scroll-viewport]");
  await expect(viewport).toHaveAttribute("data-intro", "done");
  const stage = page.getByRole("region", { name: "프로젝트 갤러리" });
  await stage.scrollIntoViewIfNeeded();
  const box = (await stage.boundingBox())!;
  const y = Math.max(120, box.y + box.height * 0.5);
  if (info.project.use.isMobile) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 280, y }],
    });
    for (let x = 260; x >= 100; x -= 20)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y }],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect(page.locator("[data-selected-project]")).toHaveAttribute(
      "data-selected-project",
      "3",
    );
    const top = await viewport.evaluate((e) => e.scrollTop);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 180, y }],
    });
    for (let offset = 20; offset <= 120; offset += 20)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 180, y: y - offset }],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect
      .poll(() => viewport.evaluate((e) => e.scrollTop))
      .toBeGreaterThan(top + 20);
    await cdp.detach();
  } else {
    await page.mouse.move(box.x + box.width * 0.6, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.4, y, { steps: 12 });
    await page.mouse.up();
    await expect(page.locator("[data-selected-project]")).toHaveAttribute(
      "data-selected-project",
      "3",
    );
  }
  await expect(page).toHaveURL(/\/#work$/);
  await expect(page.locator("[data-route-transition]")).toHaveAttribute(
    "data-active",
    "false",
  );
});

test("selected work and filter survive detail navigation; reduced motion stops gallery movement", async ({
  page,
}) => {
  await page.goto("/#work");
  await page
    .getByRole("group", { name: "프로젝트 필터" })
    .getByRole("button", { name: "개인 02", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "프로젝트 바로 선택" })
    .getByRole("button", { name: /Dog Atlas/ })
    .click();
  await page
    .getByRole("link", { name: "Dog Atlas 프로젝트 보기", exact: true })
    .click();
  await expect(page).toHaveURL(/\/work\/4$/);
  await expect(page.locator("[data-route-transition]")).toHaveAttribute(
    "data-active",
    "false",
  );
  await page.goBack();
  await expect(page.locator("[data-route-transition]")).toHaveAttribute(
    "data-active",
    "false",
  );
  await expect(page.locator("[data-selected-project]")).toHaveAttribute(
    "data-selected-project",
    "4",
  );
  await expect(
    page.getByRole("button", { name: "개인 02", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("link", { name: "Dog Atlas 프로젝트 보기", exact: true }),
  ).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-gallery-panel]").first()).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await expect(page.locator("#gallery-project-title")).toHaveCSS(
    "animation-name",
    "none",
  );
});

test("copy transitions keep navigation steady and expose only the latest project's link", async ({
  page,
}) => {
  await page.goto("/#work");
  const gallery = page.locator("[data-project-gallery]");
  const nav = page.getByRole("navigation", { name: "프로젝트 바로 선택" });
  await page
    .getByRole("button", { name: "갤러리 자동 회전 일시 정지" })
    .click();
  await nav.scrollIntoViewIfNeeded();
  const positions: number[] = [];
  for (const title of ["LEXUS", "Kia Worldwide", "Aeppy", "Dog Atlas"]) {
    await nav.getByRole("button", { name: new RegExp(title) }).click();
    positions.push(
      await nav.evaluate(
        (element) =>
          element.getBoundingClientRect().top +
          document.querySelector("[data-scroll-viewport]")!.scrollTop,
      ),
    );
    await expect(gallery.getByRole("article")).toHaveCount(1);
    await expect(
      gallery.getByRole("link", {
        name: `${title} 상세 내용 보기`,
        exact: true,
      }),
    ).toHaveCount(1);
  }
  expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(1);
  for (const title of ["LEXUS", "Aeppy", "Kia Worldwide"])
    await nav.getByRole("button", { name: new RegExp(title) }).click();
  const latest = gallery.locator("[data-selected-project]");
  await expect(latest).toHaveAttribute("data-selected-project", "3");
  await expect(gallery.getByRole("article")).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(latest).toHaveCSS("transition-duration", "0s");
  const link = gallery.getByRole("link", {
    name: "Kia Worldwide 상세 내용 보기",
    exact: true,
  });
  await link.click();
  await expect(page).toHaveURL(/\/work\/3$/);
});

test("wrapped copy rises through individual line masks and project choices use square shared-effect buttons", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 844 });
  await page.goto("/#work");
  const gallery = page.locator("[data-project-gallery]");
  const nav = page.getByRole("navigation", { name: "프로젝트 바로 선택" });
  const buttons = nav.getByRole("button");
  await expect(buttons).toHaveCount(4);
  for (const button of await buttons.all()) {
    await expect(button).toHaveAttribute("data-button-effect", "true");
    await expect(button).toHaveCSS("border-radius", "0px");
    await expect(button.locator("[data-button-label]")).toHaveCount(1);
    await expect(button.locator("[data-button-light]")).toHaveCount(1);
  }
  // Force real text wrapping; the concise task copy fits on one line at 360px.
  await page.setViewportSize({ width: 280, height: 844 });
  await page
    .getByRole("button", { name: "갤러리 자동 회전 일시 정지" })
    .click();
  await page
    .getByRole("button", { name: "다음 프로젝트", exact: true })
    .click();
  const selection = gallery.locator("[data-selected-project]");
  await expect(selection).toHaveAttribute("data-selected-project", "3");
  await expect
    .poll(() => selection.locator("li [data-gallery-line]").count())
    .toBeGreaterThan(3);
  const sequence = await selection
    .locator("[data-gallery-reveal]")
    .evaluateAll((elements) =>
      elements.map((element) => {
        const effect = element.getAnimations().at(-1)?.effect as
          | KeyframeEffect
          | undefined;
        return {
          delay: effect?.getTiming().delay,
          frames: effect?.getKeyframes().map((frame) => frame.transform),
        };
      }),
    );
  for (const [index, step] of sequence.entries()) {
    expect(step.frames).toEqual(["translateY(110%)", "translateY(0px)"]);
    if (index) expect(step.delay).toBeGreaterThan(sequence[index - 1].delay!);
  }
  for (const item of await selection.locator("li").all()) {
    const original = await item
      .locator("[data-gallery-line-source]")
      .textContent();
    const rendered = await item
      .locator("[data-line-text]")
      .evaluateAll((elements) =>
        elements
          .map((element) => element.getAttribute("data-line-text"))
          .join(""),
      );
    expect(rendered.replace(/\s/g, "")).toBe(original!.replace(/\s/g, ""));
  }
  const mask = selection.locator("li [data-gallery-line]").first();
  expect(
    await mask.evaluate((element) => getComputedStyle(element).clipPath),
  ).not.toBe("none");
  await expect
    .poll(() =>
      selection.locator("[data-line-motion]").evaluateAll((elements) =>
        elements.every(
          (element) =>
            Math.abs(
              new DOMMatrixReadOnly(getComputedStyle(element).transform).m42,
            ) < 0.05,
        ),
      ),
    )
    .toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("button", { name: "다음 프로젝트", exact: true })
    .click();
  await expect(selection).toHaveAttribute("data-selected-project", "5");
  expect(
    await selection
      .locator("[data-line-motion]")
      .evaluateAll((elements) =>
        elements.some((element) =>
          element
            .getAnimations()
            .some((animation) => animation.playState === "running"),
        ),
      ),
  ).toBe(false);
});
