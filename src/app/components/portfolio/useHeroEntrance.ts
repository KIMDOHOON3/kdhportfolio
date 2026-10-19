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
    const finish = (event?: Event) => {
      if (event) element.dataset.introCancelled = "true";
      element.dataset.intro = "done";
      setPlaying(false);
    };
    if (
      !playing ||
      pathname !== "/" ||
      motion.matches ||
      (location.hash && !["#top", "#home"].includes(location.hash)) ||
      element.scrollTop > 8
    ) {
      finish();
      return;
    }
    element.dataset.introStarted = String(performance.now());
    element.dataset.introCopy = "waiting";
    let timer = 0;
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
      element.dataset.introCopy = "ready";
      observer.disconnect();
      timer = window.setTimeout(finish, 850);
    };
    const observer = new MutationObserver(releaseCopy);
    if (glass)
      observer.observe(glass, {
        attributes: true,
        attributeFilter: ["data-hero-entrance", "data-ready", "data-failed"],
      });
    releaseCopy();
    const inputs = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    inputs.forEach((type) =>
      element.addEventListener(type, finish, { passive: true }),
    );
    motion.addEventListener("change", finish);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      inputs.forEach((type) => element.removeEventListener(type, finish));
      motion.removeEventListener("change", finish);
    };
  }, [root, pathname, playing]);
  return playing ? "playing" : "done";
}
