"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

export function useHeroEntrance(
  root: RefObject<HTMLElement | null>,
  pathname: string,
) {
  const [playing, setPlaying] = useState(pathname === "/");
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let active = true;
    const finish = () => {
      if (!active) return;
      element.dataset.introContent = "ready";
      delete element.dataset.introLock;
      element.dataset.intro = "done";
      setPlaying(false);
    };
    if (
      !playing ||
      pathname !== "/" ||
      motion.matches ||
      (location.hash && !["#top", "#home"].includes(location.hash))
    ) {
      finish();
      return;
    }
    element.dataset.introLock = "true";
    element.dataset.introContent = "waiting";
    element.scrollTop = 0;
    element.dataset.introStarted = String(performance.now());
    element.dataset.introCopy = "waiting";
    const holdPosition = () => {
      if (element.dataset.introLock === "true" && element.scrollTop)
        element.scrollTop = 0;
    };
    const block = (event: Event) => {
      if (element.dataset.introLock !== "true") return;
      // Keep browser zoom available; prevent scrolling and queued momentum.
      if (event instanceof WheelEvent && event.ctrlKey) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const blockKey = (event: KeyboardEvent) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        (event.target instanceof Element &&
          event.target.closest(
            'input, textarea, select, [contenteditable="true"]',
          ))
      )
        return;
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      )
        block(event);
    };
    element.addEventListener("wheel", block, { capture: true, passive: false });
    element.addEventListener("touchmove", block, {
      capture: true,
      passive: false,
    });
    element.addEventListener("scroll", holdPosition, { passive: true });
    window.addEventListener("keydown", blockKey, true);
    let released = false;
    const glass = element.querySelector<HTMLElement>("[data-glass-scene]");
    // Observe the real final glass frame, not an estimated download duration.
    // A failed WebGL scene releases the copy alongside its HTML fallback.
    const releaseCopy = () => {
      if (released) return;
      if (
        glass &&
        glass.dataset.failed !== "true" &&
        !(
          glass.dataset.heroEntrance === "done" &&
          glass.dataset.ready === "true"
        )
      )
        return;
      released = true;
      element.dataset.introContent = "ready";
      element.dataset.introCopy = "ready";
      observer.disconnect();
      // Unlock on the real final copy/button frame, including CSS delays.
      // Descendant arrow loops and hover effects must not hold the lock open.
      const animations = [
        ...element.querySelectorAll<HTMLElement>(
          "[data-intro-summary], [data-intro-cta]",
        ),
      ].flatMap((target) => target.getAnimations());
      void Promise.allSettled(
        animations.map((animation) => animation.finished),
      ).then(() => {
        if (active) finish();
      });
    };
    const observer = new MutationObserver(releaseCopy);
    if (glass)
      observer.observe(glass, {
        attributes: true,
        attributeFilter: ["data-hero-entrance", "data-ready", "data-failed"],
      });
    releaseCopy();
    const reduce = () => {
      if (motion.matches) finish();
    };
    motion.addEventListener("change", reduce);
    return () => {
      active = false;
      delete element.dataset.introLock;
      observer.disconnect();
      element.removeEventListener("wheel", block, true);
      element.removeEventListener("touchmove", block, true);
      element.removeEventListener("scroll", holdPosition);
      window.removeEventListener("keydown", blockKey, true);
      motion.removeEventListener("change", reduce);
    };
  }, [root, pathname, playing]);
  return playing ? "playing" : "done";
}
