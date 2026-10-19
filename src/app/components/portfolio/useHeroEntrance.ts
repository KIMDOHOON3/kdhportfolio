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
    // Text/navigation never wait for a model download. CSS also completes
    // without hydration; user input immediately releases every control.
    const timer = window.setTimeout(finish, 2700);
    const inputs = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    inputs.forEach((type) =>
      element.addEventListener(type, finish, { passive: true }),
    );
    motion.addEventListener("change", finish);
    return () => {
      clearTimeout(timer);
      inputs.forEach((type) => element.removeEventListener(type, finish));
      motion.removeEventListener("change", finish);
    };
  }, [root, pathname, playing]);
  return playing ? "playing" : "done";
}
