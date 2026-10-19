"use client";

import { useLayoutEffect, type RefObject } from "react";

/** Keep mobile browser-chrome height changes out of the scroll animation layout. */
export function useStableViewport(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const touch = matchMedia("(hover: none) and (pointer: coarse)");
    let width = -1;
    let height = -1;
    const measure = () => {
      const nextWidth = element.clientWidth;
      const nextHeight = element.clientHeight;
      if (touch.matches && width === nextWidth) return;
      if (width === nextWidth && height === nextHeight) return;
      width = nextWidth;
      height = nextHeight;
      if (touch.matches) {
        element.style.setProperty("--layout-vh", `${height / 100}px`);
        // Reserve the large viewport once so hiding browser chrome cannot
        // expose an uncovered strip or reallocate all glass render targets.
        element.style.removeProperty("--glass-viewport-height");
        const glass = element.querySelector("[data-glass-scene]");
        const glassHeight = Math.max(
          height,
          glass?.getBoundingClientRect().height ?? height,
        );
        element.style.setProperty(
          "--glass-viewport-height",
          `${glassHeight}px`,
        );
        element.dataset.layoutHeight = String(height);
      } else {
        element.style.removeProperty("--layout-vh");
        element.style.removeProperty("--glass-viewport-height");
        delete element.dataset.layoutHeight;
      }
    };
    const reset = () => {
      width = -1;
      measure();
    };
    measure();
    window.addEventListener("resize", measure);
    touch.addEventListener("change", reset);
    return () => {
      window.removeEventListener("resize", measure);
      touch.removeEventListener("change", reset);
    };
  }, [root]);
}
