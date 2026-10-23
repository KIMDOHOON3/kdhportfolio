"use client";

import { useLayoutEffect, useRef } from "react";

/** One sequence for actual text lines, technology labels and the final action. */
export default function useGalleryCopyMotion(active: boolean) {
  const ref = useRef<HTMLElement>(null);
  const previous = useRef<boolean | null>(null);
  const animations = useRef<Animation[]>([]);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const elements = () => [
      ...root.querySelectorAll<HTMLElement>("[data-gallery-reveal]"),
    ];
    const targets = elements();
    const current = targets.map(
      (element) => getComputedStyle(element).transform,
    );
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const changed = previous.current !== null && previous.current !== active;
    previous.current = active;
    const known = new WeakSet(targets);
    const settle = (element: HTMLElement) => {
      element.style.transform = active ? "translateY(0)" : "translateY(110%)";
    };
    targets.forEach((element, index) => {
      settle(element);
      if (!changed || motion.matches) return;
      animations.current.push(
        element.animate(
          [
            { transform: active ? "translateY(110%)" : current[index] },
            { transform: active ? "translateY(0)" : "translateY(-110%)" },
          ],
          {
            duration: active ? 620 : 180,
            delay: active ? 100 + index * 100 : 0,
            easing: active
              ? "cubic-bezier(.25,.8,.25,1)"
              : "cubic-bezier(.4,0,1,1)",
            fill: "both",
          },
        ),
      );
    });
    // Line measurement can finish after the parent effect, or change on resize.
    // Settle only newly created lines without restarting an ongoing sequence.
    const observer = new MutationObserver(() => {
      elements().forEach((element) => {
        if (known.has(element)) return;
        known.add(element);
        settle(element);
      });
    });
    observer.observe(root, { childList: true, subtree: true });
    const reduce = () => {
      if (!motion.matches) return;
      animations.current.forEach((animation) => animation.cancel());
      animations.current = [];
      elements().forEach(settle);
    };
    motion.addEventListener("change", reduce);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", reduce);
    };
  }, [active]);

  useLayoutEffect(
    () => () => animations.current.forEach((animation) => animation.cancel()),
    [],
  );
  return ref;
}
