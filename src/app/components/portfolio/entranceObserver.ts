import { getScrollViewport } from "./ScrollViewport";

const waiting = new Map<Element, () => void>();
const visible = new Set<Element>();
const gates = new Map<HTMLElement, MutationObserver>();
let observer: IntersectionObserver | undefined;

function release() {
  if (waiting.size) return;
  observer?.disconnect();
  observer = undefined;
  gates.forEach((gate) => gate.disconnect());
  gates.clear();
  visible.clear();
}

function enter(element: Element) {
  if (!visible.has(element)) return;
  const journey = element
    .closest("[data-journey-page]")
    ?.closest<HTMLElement>("[data-journey]");
  if (
    journey &&
    (journey.dataset.ready !== "true" || journey.dataset.entered !== "true")
  )
    return;
  const callback = waiting.get(element);
  if (!callback) return;
  waiting.delete(element);
  visible.delete(element);
  observer?.unobserve(element);
  callback();
  release();
}

/** Share one visibility observer; the hidden journey waits for its portal to finish. */
export function observeEntrance(element: Element, callback: () => void) {
  if (!observer)
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
          enter(entry.target);
        });
      },
      { root: getScrollViewport(), rootMargin: "0px 0px -32px 0px" },
    );
  waiting.set(element, callback);
  const journey = element
    .closest("[data-journey-page]")
    ?.closest<HTMLElement>("[data-journey]");
  if (journey && !gates.has(journey)) {
    const gate = new MutationObserver(() => {
      if (
        journey.dataset.ready === "true" &&
        journey.dataset.entered === "true"
      )
        [...visible].forEach(enter);
    });
    gate.observe(journey, {
      attributes: true,
      attributeFilter: ["data-entered", "data-ready"],
    });
    gates.set(journey, gate);
  }
  observer.observe(element);
  return () => {
    waiting.delete(element);
    visible.delete(element);
    observer?.unobserve(element);
    release();
  };
}
