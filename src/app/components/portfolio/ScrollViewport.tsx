"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import styles from "./Portfolio.module.scss";

type ScrollSnapshot = {
  top: number;
  height: number;
  limit: number;
  velocity: number;
};
const listeners = new Set<(state: ScrollSnapshot) => void>();
let engine: Lenis | null = null;

export const getScrollViewport = () =>
  document.querySelector<HTMLElement>("[data-scroll-viewport]");
export const readScroll = (): ScrollSnapshot => {
  const element = getScrollViewport();
  return {
    top: element?.scrollTop ?? window.scrollY,
    height: element?.clientHeight ?? window.innerHeight,
    limit: element
      ? Math.max(0, element.scrollHeight - element.clientHeight)
      : 0,
    velocity: engine?.velocity ?? 0,
  };
};
export const subscribeScroll = (listener: (state: ScrollSnapshot) => void) => {
  listeners.add(listener);
  listener(readScroll());
  return () => {
    listeners.delete(listener);
  };
};

/** Shared native overflow container with Lenis smoothing. */
export default function ScrollViewport({ children }: { children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    const wrapper = viewport.current;
    const body = content.current;
    if (!wrapper || !body) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let pending = false;
    const notify = () => {
      pending = true;
    };
    const flush = () => {
      pending = false;
      const snapshot = readScroll();
      if (wrapper.dataset.storyDark !== "false")
        wrapper.dataset.storyDark = "false";
      listeners.forEach((listener) => listener(snapshot));
    };
    const configure = () => {
      engine?.destroy();
      engine = motion.matches
        ? null
        : new Lenis({
            wrapper,
            content: body,
            lerp: 0.1,
            smoothWheel: true,
            syncTouch: true,
            // The wrapper's handler owns same-page anchors and URL updates.
            anchors: false,
            autoRaf: false,
          });
      notify();
    };
    const raf = (time: number) => {
      engine?.raf(time);
      if (pending) flush();
      frame = requestAnimationFrame(raf);
    };
    const anchor = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element).closest<HTMLAnchorElement>(
        'a[href*="#"]',
      );
      if (!link) return;
      const url = new URL(link.href);
      if (
        url.origin !== location.origin ||
        url.pathname !== location.pathname ||
        !url.hash
      )
        return;
      const target = document.getElementById(
        decodeURIComponent(url.hash.slice(1)),
      );
      if (!target) return;
      event.preventDefault();
      history.replaceState(null, "", url.hash);
      const actualTop = target.getBoundingClientRect().top + wrapper.scrollTop;
      const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      if (engine) {
        // Focusing an offscreen link can change the native scroll position
        // before Lenis receives that scroll event. Use actual coordinates.
        engine.scrollTo(wrapper.scrollTop, { immediate: true, force: true });
        // Integral destinations also let Lenis finish its rounding-based lerp
        // when responsive layout produces an exact half-pixel anchor.
        engine.scrollTo(Math.round(actualTop - margin));
      } else
        wrapper.scrollTo({
          top:
            actualTop -
            (location.pathname !== "/" || target.id.startsWith("journey-")
              ? margin
              : 0),
          behavior: "instant",
        });
    };
    configure();
    frame = requestAnimationFrame(raf);
    wrapper.addEventListener("scroll", notify, { passive: true });
    window.addEventListener("resize", notify);
    wrapper.addEventListener("click", anchor, true);
    motion.addEventListener("change", configure);
    const resize = new ResizeObserver(notify);
    resize.observe(body);
    return () => {
      cancelAnimationFrame(frame);
      engine?.destroy();
      engine = null;
      wrapper.removeEventListener("scroll", notify);
      wrapper.removeEventListener("click", anchor, true);
      window.removeEventListener("resize", notify);
      motion.removeEventListener("change", configure);
      resize.disconnect();
    };
  }, []);
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const id = location.hash.slice(1);
    const target = id ? document.getElementById(decodeURIComponent(id)) : null;
    let following = true;
    const align = () => {
      if (!following || (id && location.hash.slice(1) !== id)) return;
      engine?.resize();
      // Detail anchors keep their heading below the fixed header on first
      // entry too. Home's full-screen section alignment remains unchanged.
      const margin =
        target && (pathname !== "/" || id.startsWith("journey-"))
          ? parseFloat(getComputedStyle(target).scrollMarginTop) || 0
          : 0;
      const top = target
        ? target.getBoundingClientRect().top + element.scrollTop - margin
        : 0;
      if (engine) engine.scrollTo(top, { immediate: true, force: true });
      else element.scrollTop = top;
    };
    align();
    if (!target || !content.current) return;
    // Fonts and the enhanced story can change the initial anchor's offset
    // after hydration. Follow that layout only until the user takes control.
    const resize = new ResizeObserver(align);
    resize.observe(content.current);
    const stop = () => {
      following = false;
      resize.disconnect();
    };
    const inputs = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    inputs.forEach((type) =>
      element.addEventListener(type, stop, { passive: true }),
    );
    document.fonts.ready.then(align);
    return () => {
      stop();
      inputs.forEach((type) => element.removeEventListener(type, stop));
    };
  }, [pathname]);
  return (
    <div
      ref={viewport}
      className={styles.scrollViewport}
      data-scroll-viewport
      data-home={pathname === "/"}
      tabIndex={-1}
    >
      <div ref={content} data-scroll-content>
        {children}
      </div>
    </div>
  );
}
