"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { observeEntrance } from "./entranceObserver";

let entered = false;
type Phase = "pending" | "film" | "copy" | "done";

/** Continue the heading/filter entrance once; filter changes and route returns skip it. */
export default function useGalleryEntrance(
  stage: RefObject<HTMLDivElement | null>,
) {
  const root = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>(() =>
    entered ? "done" : "pending",
  );
  const timers = useRef<number[]>([]);
  const film = useRef<Animation | null>(null);
  const settled = useRef(phase === "done");
  const finish = useCallback(() => {
    entered = true;
    settled.current = true;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    film.current?.cancel();
    stage.current
      ?.querySelector("[data-gallery-canvas]")
      ?.dispatchEvent(new Event("gallery:finish-enter"));
    setPhase("done");
  }, [stage]);

  useLayoutEffect(() => {
    const element = root.current;
    const surface = stage.current;
    if (!element || !surface || settled.current) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) {
      finish();
      return;
    }
    const heading = element
      .closest("#work")
      ?.querySelector("[data-entrance-area='프로젝트 제목·필터']");
    let eligible = false;
    let started = false;
    let fallbackTimer = 0;
    const later = (callback: () => void, delay: number) => {
      timers.current.push(window.setTimeout(callback, delay));
    };
    const start = () => {
      if (started || settled.current) return;
      started = true;
      entered = true;
      unsubscribe();
      watcher.disconnect();
      window.clearTimeout(fallbackTimer);
      setPhase("film");
      const canvas = surface.querySelector("[data-gallery-canvas]");
      canvas?.dispatchEvent(new Event("gallery:enter"));
      film.current = surface.animate(
        [
          { opacity: 0, transform: "translateY(14px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 850, easing: "cubic-bezier(.22,.75,.25,1)", fill: "both" },
      );
      const steps = element.querySelectorAll(
        "[data-selected-project] [data-gallery-reveal]",
      ).length;
      const navDelay = (steps + 1) * 100;
      element.style.setProperty("--gallery-nav-delay", `${navDelay}ms`);
      later(() => setPhase("copy"), 750);
      later(finish, 750 + navDelay + 650);
    };
    const check = () => {
      if (!eligible || started || settled.current) return;
      const title = heading?.querySelector<HTMLElement>("[data-copy-reveal]");
      const filters = [
        ...(heading?.querySelectorAll<HTMLElement>("[data-element-reveal]") ??
          []),
      ];
      if (
        title?.dataset.copyEntrance !== "done" ||
        filters.some((filter) => filter.dataset.elementState !== "done")
      )
        return;
      const ready = surface.querySelector<HTMLElement>("[data-gallery-canvas]")
        ?.dataset.ready;
      if (ready === "true" || ready === "fallback") start();
      // Keep the selected static artwork usable if WebGL/textures load slowly.
      else if (!fallbackTimer) fallbackTimer = window.setTimeout(start, 800);
    };
    const watcher = new MutationObserver(check);
    if (heading)
      watcher.observe(heading, {
        subtree: true,
        attributes: true,
        attributeFilter: ["data-copy-entrance", "data-element-state"],
      });
    watcher.observe(surface, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-ready"],
    });
    const unsubscribe = observeEntrance(surface, () => {
      eligible = true;
      check();
    });
    const reduce = () => {
      if (motion.matches) finish();
    };
    motion.addEventListener("change", reduce);
    return () => {
      unsubscribe();
      watcher.disconnect();
      window.clearTimeout(fallbackTimer);
      timers.current.forEach(clearTimeout);
      timers.current = [];
      film.current?.cancel();
      motion.removeEventListener("change", reduce);
    };
  }, [finish, stage]);
  return { root, phase, finish };
}
