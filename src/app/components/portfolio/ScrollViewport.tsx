"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import styles from "./Portfolio.module.scss";
import entranceStyles from "./HeroEntrance.module.scss";
import { useHeroEntrance } from "./useHeroEntrance";

type ScrollSnapshot = {
  top: number;
  height: number;
  limit: number;
  velocity: number;
  hasHero: boolean;
  heroBottom: number;
  footerTop: number;
  footerHeight: number;
  endingTop: number | null;
  endingHeight: number;
};
const listeners = new Set<(state: ScrollSnapshot) => void>();
let engine: Lenis | null = null;
type Region = { top: number; height: number };
let regions: {
  hero: Region | null;
  footer: Region | null;
  ending: Region | null;
} | null = null;
let regionPath = "";

export const getScrollViewport = () =>
  document.querySelector<HTMLElement>("[data-scroll-viewport]");
const measureRegions = () => {
  const top = getScrollViewport()?.scrollTop ?? window.scrollY;
  const measure = (selector: string): Region | null => {
    const rect = document.querySelector(selector)?.getBoundingClientRect();
    return rect ? { top: rect.top + top, height: rect.height } : null;
  };
  regions = {
    hero: measure("[data-hero]"),
    footer: measure("#contact"),
    ending: measure("[data-journey-ending]"),
  };
  regionPath = location.pathname;
};
export const readScroll = (): ScrollSnapshot => {
  const element = getScrollViewport();
  if (!regions || regionPath !== location.pathname) measureRegions();
  const top = element?.scrollTop ?? window.scrollY;
  const height = element?.clientHeight ?? window.innerHeight;
  const { hero, footer, ending } = regions!;
  return {
    top,
    height,
    limit: element
      ? Math.max(0, element.scrollHeight - element.clientHeight)
      : 0,
    velocity: engine?.velocity ?? 0,
    hasHero: !!hero,
    heroBottom: hero ? hero.top + hero.height - top : 0,
    footerTop: footer ? footer.top - top : height,
    footerHeight: footer?.height ?? height,
    endingTop: ending ? ending.top - top : null,
    endingHeight: ending?.height ?? 1,
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
  const initialized = useRef(false);
  useLayoutEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming | undefined;
    // Reset a home-page refresh before the intro and anchor alignment run.
    // Direct section links and subsequent client-side navigation still work.
    if (pathname !== "/" || navigation?.type !== "reload") return;
    history.scrollRestoration = "manual";
    history.replaceState(history.state, "", location.pathname + location.search);
    if (viewport.current) viewport.current.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [pathname]);
  const intro = useHeroEntrance(viewport, pathname);
  useEffect(() => {
    const wrapper = viewport.current;
    const body = content.current;
    if (!wrapper || !body) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let pending = false;
    let layoutDirty = true;
    const notify = () => {
      pending = true;
    };
    const flush = () => {
      pending = false;
      if (layoutDirty) {
        measureRegions();
        layoutDirty = false;
      }
      const snapshot = readScroll();
      const scrolled = String(
        snapshot.top > 12 &&
          (!snapshot.hasHero || snapshot.heroBottom <= snapshot.height * 0.2),
      );
      if (wrapper.dataset.scrolled !== scrolled)
        wrapper.dataset.scrolled = scrolled;
      if (wrapper.dataset.storyDark !== "false")
        wrapper.dataset.storyDark = "false";
      listeners.forEach((listener) => listener(snapshot));
    };
    const layoutChange = () => {
      layoutDirty = true;
      notify();
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
            // Touch already scrolls natively on the compositor. Avoid running
            // a second momentum simulation alongside the glass render loop.
            syncTouch: false,
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
    window.addEventListener("resize", layoutChange);
    wrapper.addEventListener("click", anchor, true);
    motion.addEventListener("change", configure);
    const resize = new ResizeObserver(layoutChange);
    resize.observe(body);
    resize.observe(wrapper);
    return () => {
      cancelAnimationFrame(frame);
      engine?.destroy();
      engine = null;
      wrapper.removeEventListener("scroll", notify);
      wrapper.removeEventListener("click", anchor, true);
      window.removeEventListener("resize", layoutChange);
      motion.removeEventListener("change", configure);
      resize.disconnect();
      regions = null;
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
      measureRegions();
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
      className={`${styles.scrollViewport} ${entranceStyles.scope}`}
      data-intro={intro}
      data-scroll-viewport
      data-scrolled="false"
      data-home={pathname === "/"}
      tabIndex={-1}
    >
      <div ref={content} data-scroll-content>
        {children}
      </div>
    </div>
  );
}
