"use client";

import { useEffect, useRef } from "react";
import type { GalleryScene } from "./galleryScene";

export default function GalleryCanvas({
  ids,
  selected,
  autoplay,
  onSelect,
}: {
  ids: number[];
  selected: number;
  autoplay: boolean;
  onSelect: (id: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<GalleryScene | null>(null);
  const callback = useRef(onSelect);
  callback.current = onSelect;
  const current = useRef(selected);
  current.current = selected;
  const auto = useRef(autoplay);
  auto.current = autoplay;
  const key = ids.join(",");
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const viewport = document.querySelector<HTMLElement>(
      "[data-scroll-viewport]",
    );
    let engine: GalleryScene | null = null;
    let inView = false;
    const configure = () => {
      engine?.setReduced(reduced.matches);
      engine?.setAutoplay(auto.current && !reduced.matches);
    };
    const observer = new IntersectionObserver(
      async ([entry]) => {
        inView = entry.isIntersecting;
        if (cancelled) return;
        if (entry.isIntersecting && !engine) {
          try {
            const sceneModule = await import("./galleryScene");
            if (cancelled) return;
            engine = sceneModule.getGalleryScene();
            scene.current = engine;
            await engine.attach(
              element,
              key.split(",").map(Number),
              current.current,
              (id) => callback.current(id),
            );
            // Cleanup already detached this subscription. A later attach may
            // now own the same host, so an old request must not detach it again.
            if (cancelled) return;
            engine.select(current.current);
            configure();
            engine.setVisible(inView);
          } catch {
            if (!cancelled) element.dataset.ready = "fallback";
          }
        } else engine?.setVisible(entry.isIntersecting);
      },
      { root: viewport, rootMargin: "200px 0px" },
    );
    observer.observe(element);
    const visibility = () =>
      engine?.setVisible(
        !document.hidden &&
          element.getBoundingClientRect().bottom > 0 &&
          element.getBoundingClientRect().top < innerHeight,
      );
    const drag = (event: Event) =>
      engine?.drag((event as CustomEvent<number>).detail);
    const release = (event: Event) =>
      engine?.release((event as CustomEvent<boolean>).detail);
    const pick = (event: Event) => {
      if (!engine) return;
      const { x, y } = (event as CustomEvent<{ x: number; y: number }>).detail;
      const target = engine.pickTarget(x, y);
      if (!target) return;
      const { id, slot } = target;
      if (id === current.current)
        element
          .closest("[data-project-gallery]")
          ?.querySelector<HTMLAnchorElement>("[data-gallery-open]")
          ?.click();
      else if (id) {
        engine.select(id, slot);
        callback.current(id);
      }
    };
    const hover = (event: Event) => {
      const point = (
        event as CustomEvent<{ x: number; y: number; id: number | null }>
      ).detail;
      point.id = engine?.pick(point.x, point.y) ?? null;
    };
    const enter = () => engine?.enter();
    const finishEnter = () => engine?.finishEntrance();
    element.addEventListener("gallery:enter", enter);
    element.addEventListener("gallery:finish-enter", finishEnter);
    element.addEventListener("gallery:hover", hover);
    element.addEventListener("gallery:drag", drag);
    element.addEventListener("gallery:release", release);
    element.addEventListener("gallery:pick", pick);
    reduced.addEventListener("change", configure);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelled = true;
      observer.disconnect();
      engine?.detach(element);
      scene.current = null;
      reduced.removeEventListener("change", configure);
      document.removeEventListener("visibilitychange", visibility);
      element.removeEventListener("gallery:hover", hover);
      element.removeEventListener("gallery:drag", drag);
      element.removeEventListener("gallery:release", release);
      element.removeEventListener("gallery:pick", pick);
      element.removeEventListener("gallery:enter", enter);
      element.removeEventListener("gallery:finish-enter", finishEnter);
    };
  }, [key]);
  useEffect(() => scene.current?.select(selected), [selected]);
  useEffect(() => scene.current?.setAutoplay(autoplay), [autoplay]);
  return (
    <div
      ref={host}
      data-gallery-canvas
      data-ready="false"
      style={{ position: "absolute", inset: 0 }}
      aria-hidden="true"
    />
  );
}
