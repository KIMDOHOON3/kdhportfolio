import { useEffect, type RefObject } from "react";
import { readScroll, subscribeScroll } from "./ScrollViewport";

/** No section pinning: only project covers respond to scroll velocity. */
export default function usePaperMotion(
  root: RefObject<HTMLElement | null>,
  filter: string,
) {
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const covers = Array.from(
      root.current?.querySelectorAll<HTMLElement>("[data-paper-cover]") ?? [],
    );
    // Screen-space displacement: preserve card geometry, warp only its surface.
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pixels = ctx.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y++) {
      const centered = (y / (canvas.height - 1)) * 2 - 1;
      const profile = 1 - Math.sqrt(Math.max(0, 1 - centered * centered));
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        pixels.data[i] = Math.round(
          (0.5 - profile * (x / (canvas.width - 1) - 0.5)) * 255,
        );
        pixels.data[i + 1] = 128;
        pixels.data[i + 2] = 128;
        pixels.data[i + 3] = 255;
      }
    }
    ctx.putImageData(pixels, 0, 0);
    const mapUrl = canvas.toDataURL();
    const surfaces = covers.map((cover) => ({
      cover,
      filter: cover.querySelector<SVGFilterElement>("[data-curl-filter]"),
      map: cover.querySelector<SVGFEImageElement>("[data-curl-map]"),
      scale:
        cover.querySelector<SVGFEDisplacementMapElement>("[data-curl-scale]"),
      surface: cover.querySelector<HTMLElement>("[data-cover-surface]"),
    }));
    surfaces.forEach(({ map }) => map?.setAttribute("href", mapUrl));
    let previous = readScroll().top,
      previousTime = performance.now(),
      strength = 0,
      frame = 0,
      speed = 0;
    const render = (time: number) => {
      const dt = Math.min(0.1, Math.max(1 / 240, (time - previousTime) / 1000));
      previousTime = time;
      const target = media.matches ? 0 : Math.min(1, speed / 800);
      strength +=
        (target - strength) *
        (1 - Math.exp(-dt / (target > strength ? 0.025 : 0.175)));
      surfaces.forEach(({ cover, filter, map, scale, surface }) => {
        const rect = cover.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        filter?.setAttribute("x", "0");
        filter?.setAttribute("y", "0");
        filter?.setAttribute("width", String(rect.width));
        filter?.setAttribute("height", String(rect.height));
        map?.setAttribute("x", String(-rect.left));
        map?.setAttribute("y", String(-rect.top));
        map?.setAttribute("width", String(innerWidth));
        map?.setAttribute("height", String(innerHeight));
        scale?.setAttribute("scale", String(0.06 * strength * innerWidth));
        if (surface && filter)
          surface.style.filter = media.matches ? "none" : `url(#${filter.id})`;
      });
      speed *= Math.exp(-dt / 0.08);
      if (strength > 0.0001 || speed > 1) frame = requestAnimationFrame(render);
      else frame = 0;
    };
    let lastScrollTime = performance.now();
    const unsubscribe = subscribeScroll(({ top }) => {
      const now = performance.now();
      const dt = Math.max(
        1 / 240,
        Math.min(0.1, (now - lastScrollTime) / 1000),
      );
      speed = Math.abs(top - previous) / dt;
      previous = top;
      lastScrollTime = now;
      if (!frame) {
        previousTime = now;
        frame = requestAnimationFrame(render);
      }
    });
    return () => {
      unsubscribe();
      cancelAnimationFrame(frame);
      surfaces.forEach(({ surface }) =>
        surface?.style.removeProperty("filter"),
      );
    };
  }, [root, filter]);
}
