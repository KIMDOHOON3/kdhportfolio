import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getScrollViewport } from "./ScrollViewport";

type Area = {
  element: HTMLElement;
  members: Set<HTMLElement>;
  entered: boolean;
  project: boolean;
  trigger?: ScrollTrigger;
};
type Entrance = { callback: () => void; area: Area };
const waiting = new Map<HTMLElement, Entrance>();
const gates = new Map<HTMLElement, MutationObserver>();
const areas = new Map<HTMLElement, Area>();
const cursors = new WeakMap<Element, number>();
let layoutObserver: ResizeObserver | undefined;
let frame = 0;
let refreshFrame = 0;
let fontsWaiting = false;
let sequence = 0;
let registered = false;

function refresh() {
  if (refreshFrame) return;
  refreshFrame = requestAnimationFrame(() => {
    refreshFrame = 0;
    if (areas.size) ScrollTrigger.refresh();
  });
}

function watchLayout() {
  if (layoutObserver) return;
  const scroller = getScrollViewport();
  const content = document.querySelector("[data-scroll-content]");
  layoutObserver = new ResizeObserver(refresh);
  if (scroller) layoutObserver.observe(scroller);
  if (content) layoutObserver.observe(content);
  void document.fonts.ready.then(refresh);
}

function release() {
  if (waiting.size || areas.size) return;
  layoutObserver?.disconnect();
  layoutObserver = undefined;
  gates.forEach((gate) => gate.disconnect());
  gates.clear();
  if (frame) cancelAnimationFrame(frame);
  if (refreshFrame) cancelAnimationFrame(refreshFrame);
  frame = 0;
  refreshFrame = 0;
}
function coverFor(element: HTMLElement) {
  if (
    !element.matches("[data-project-action]") &&
    !element.closest("[data-entrance-after-cover]")
  )
    return null;
  return (
    element
      .closest("[data-paper-surface]")
      ?.querySelector<HTMLElement>("[data-cover-entrance]") ?? null
  );
}
function ready(element: HTMLElement) {
  const footer = element.closest<HTMLElement>("[data-footer-entrance]");
  if (footer && footer.dataset.footerEntrance !== "done") return false;
  const journey = element
    .closest("[data-journey-page]")
    ?.closest<HTMLElement>("[data-journey]");
  if (
    journey &&
    (journey.dataset.ready !== "true" || journey.dataset.entered !== "true")
  )
    return false;
  const cover = coverFor(element);
  return !cover || cover.dataset.coverEntrance === "done";
}
// Read layout offsets once per entry batch. Animated scale/translation must not
// change the row order, and scrolling never needs a per-frame geometry loop.
function position(element: HTMLElement) {
  let top = 0,
    left = 0;
  let node: HTMLElement | null = element;
  while (node) {
    top += node.offsetTop;
    left += node.offsetLeft;
    node = node.offsetParent as HTMLElement | null;
  }
  return { top, left };
}
function flush() {
  frame = 0;
  if (document.fonts.status === "loading") {
    if (!fontsWaiting) {
      fontsWaiting = true;
      void document.fonts.ready.then(() => {
        fontsWaiting = false;
        queue();
      });
    }
    return;
  }
  const scopes = new Map<
    Element,
    { element: HTMLElement; top: number; left: number }[]
  >();
  waiting.forEach((entry, element) => {
    if (!entry.area.entered || !ready(element)) return;
    const scope =
      element.closest("section, footer") ?? document.documentElement;
    const group = scopes.get(scope) ?? [];
    group.push({ element, ...position(element) });
    scopes.set(scope, group);
  });
  const now = performance.now();
  scopes.forEach((items, scope) => {
    const project = scope instanceof HTMLElement && scope.id === "work";
    const maxDelay = project ? 1000 : Infinity;
    const step = project ? 75 : 90;
    const rowGap = project ? 75 : 90;
    items.sort((a, b) => a.top - b.top || a.left - b.left);
    const rows: (typeof items)[] = [];
    items.forEach((item) => {
      const row = rows.at(-1);
      if (row && item.top - row[0].top <= 22) row.push(item);
      else rows.push([item]);
    });
    let cursor = Math.min(Math.max(now, cursors.get(scope) ?? now), now + 600);
    const together = new Map<Area, number>();
    rows.forEach((row) => {
      row.sort((a, b) => a.left - b.left);
      row.forEach(({ element }) => {
        const entry = waiting.get(element);
        if (!entry) return;
        let start = Math.min(cursor, now + maxDelay);
        if (entry.area.element.dataset.entranceMode === "together") {
          start = together.get(entry.area) ?? start;
          together.set(entry.area, start);
        }
        element.style.setProperty(
          "--entrance-delay",
          `${Math.round(start - now)}ms`,
        );
        element.dataset.entranceAt = String(start);
        waiting.delete(element);
        entry.callback();
        cursor += step;
      });
      cursor += rowGap;
    });
    cursors.set(scope, cursor);
  });
  release();
}
function queue() {
  if (!frame) frame = requestAnimationFrame(flush);
}
function gate(element: HTMLElement | null, attributes: string[]) {
  if (!element || gates.has(element)) return;
  const watcher = new MutationObserver(queue);
  watcher.observe(element, { attributes: true, attributeFilter: attributes });
  gates.set(element, watcher);
}

function areaFor(element: HTMLElement) {
  const root =
    element.closest<HTMLElement>("[data-entrance-area], section, footer") ??
    element;
  const existing = areas.get(root);
  if (existing) return existing;
  const area: Area = {
    element: root,
    members: new Set(),
    entered: false,
    project: !!root.closest("#work"),
  };
  areas.set(root, area);
  const enter = () => {
    area.entered = true;
    queue();
  };
  const id = `entrance-${++sequence}`;
  root.dataset.entranceTriggerId = id;
  area.trigger = ScrollTrigger.create({
    id,
    trigger: root,
    scroller: getScrollViewport() ?? undefined,
    // Projects start near the viewport edge; other sections retain 80%.
    // Clamp lets final footer items reveal before the scroll area ends.
    start: area.project ? "clamp(top 85%)" : "clamp(top 80%)",
    end: "bottom top",
    markers: false,
    onEnter: enter,
    onEnterBack: enter,
    // Refresh also covers direct anchors, responsive reflow and filter changes.
    onRefresh: (self) => {
      if (self.scroll() >= self.start) enter();
    },
  });
  watchLayout();
  refresh();
  return area;
}

/** One trigger per area; its children keep their existing row sequence. */
export function observeEntrance(element: HTMLElement, callback: () => void) {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  const area = areaFor(element);
  area.members.add(element);
  waiting.set(element, { callback, area });
  gate(
    element
      .closest("[data-journey-page]")
      ?.closest<HTMLElement>("[data-journey]") ?? null,
    ["data-ready", "data-entered"],
  );
  gate(coverFor(element), ["data-cover-entrance"]);
  gate(element.closest<HTMLElement>("[data-footer-entrance]"), [
    "data-footer-entrance",
  ]);
  if (area.entered) queue();
  let observing = true;
  return () => {
    if (!observing) return;
    observing = false;
    waiting.delete(element);
    area.members.delete(element);
    if (!area.members.size) {
      area.trigger?.kill();
      delete area.element.dataset.entranceTriggerId;
      areas.delete(area.element);
    }
    release();
  };
}
