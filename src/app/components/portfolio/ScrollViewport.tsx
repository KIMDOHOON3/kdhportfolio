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

/** The reference's single native overflow container, driven by Lenis at lerp .1. */
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
    const notify = () => {
      const snapshot = readScroll();
      const story = document
        .querySelector<HTMLElement>("[data-scroll-story]")
        ?.getBoundingClientRect();
      if (
        motion.matches ||
        !story ||
        wrapper.dataset.storyFallback === "true"
      ) {
        wrapper.dataset.storyDark = String(
          !!story && story.top <= 80 && story.bottom > 80,
        );
      }
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
            anchors: true,
            autoRaf: false,
          });
      notify();
    };
    const raf = (time: number) => {
      engine?.raf(time);
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
      if (engine) engine.scrollTo(target, { offset: 0 });
      else
        wrapper.scrollTo({
          top: target.getBoundingClientRect().top + wrapper.scrollTop,
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
      const top = target
        ? target.getBoundingClientRect().top + element.scrollTop
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
