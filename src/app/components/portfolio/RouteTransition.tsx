"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearRouteScroll,
  prepareRouteScroll,
  rememberRouteScroll,
} from "./routeScroll";
import styles from "./RouteTransition.module.scss";
import { createRouteTunnel } from "./routeTunnel";

const projectPath = (path: string) => /^\/work\/\d+\/?$/.test(path);
const relevant = (from: URL, to: URL) =>
  from.pathname !== to.pathname &&
  (projectPath(from.pathname) || projectPath(to.pathname));
const easing = "cubic-bezier(.65,0,.25,1)";
const historyKey = "portfolioRouteIndex";

/** A bounded transition; the portfolio's shared Three.js scene stays mounted. */
export default function RouteTransition() {
  const layer = useRef<HTMLDivElement>(null);
  const commit = useRef<() => void>(() => {});
  const pathname = usePathname();
  const router = useRouter();

  useLayoutEffect(() => {
    const root = layer.current;
    if (!root) return;
    const veil = root.querySelector<HTMLElement>("[data-route-veil]")!;
    const passage = root.querySelector<HTMLCanvasElement>(
      "[data-route-tunnel]",
    )!;
    const tunnel = createRouteTunnel(passage);
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let current = new URL(location.href);
    let index = Number(history.state?.[historyKey]) || 0;
    let animations: Animation[] = [];
    let active: {
      url: URL;
      index: number;
      back: boolean;
      covered: boolean;
      committed: boolean;
      revealing: boolean;
      origin: string;
      fromPath: string;
    } | null = null;
    let timeout = 0;
    let generation = 0;
    let frame = 0;
    const viewport = () =>
      document.querySelector<HTMLElement>("[data-scroll-viewport]");
    const foreground = () => document.getElementById("main-content");
    const stamp = () =>
      history.replaceState({ ...history.state, [historyKey]: index }, "");
    stamp();

    const animate = (
      element: Element,
      frames: Keyframe[],
      options: KeyframeAnimationOptions,
    ) => {
      const animation = element.animate(frames, {
        fill: "both",
        easing,
        ...options,
      });
      animations.push(animation);
      return animation;
    };
    const cancelAnimations = () => {
      animations.forEach((animation) => animation.cancel());
      animations = [];
    };
    const unlock = () => {
      const wrapper = viewport();
      if (wrapper) {
        delete wrapper.dataset.routeLock;
        delete wrapper.dataset.routePhase;
      }
      foreground()?.removeAttribute("aria-busy");
      window.dispatchEvent(new Event("portfolio:route-settled"));
    };
    const reset = () => {
      generation++;
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      cancelAnimations();
      tunnel.stop();
      root.dataset.active = "false";
      root.dataset.phase = "idle";
      active = null;
      unlock();
      clearRouteScroll();
    };
    const remember = () =>
      rememberRouteScroll(current, viewport()?.scrollTop ?? 0);
    const reveal = () => {
      const navigation = active;
      if (!navigation?.covered || !navigation.committed || navigation.revealing)
        return;
      navigation.revealing = true;
      const token = generation;
      // Let the new route's layout effects and scroll alignment settle under
      // the opaque cover. This also avoids measuring transformed content.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if (token !== generation) return;
          root.dataset.phase = "enter";
          const wrapper = viewport();
          if (wrapper) wrapper.dataset.routePhase = "enter";
          const page = foreground();
          const arrivalOrigin = `50% ${Math.round((wrapper?.scrollTop ?? 0) + innerHeight * 0.45)}px`;
          if (page) {
            animate(
              page,
              [
                {
                  transform: navigation.back
                    ? "scale(1.3) translate3d(-2%, 1%, 0)"
                    : "scale(.8) translate3d(2%, -1%, 0)",
                  opacity: 1,
                  transformOrigin: arrivalOrigin,
                },
                {
                  transform: "scale(1) translate3d(0, 0, 0)",
                  opacity: 1,
                  transformOrigin: arrivalOrigin,
                },
              ],
              { duration: 550, easing: "cubic-bezier(.16,1,.3,1)" },
            );
          }
          tunnel.arrive();
          animate(veil, [{ opacity: 1 }, { opacity: 0 }], {
            duration: 180,
          });
          const opening = animate(
            passage,
            [{ opacity: 1 }, { opacity: 1, offset: 0.92 }, { opacity: 0 }],
            {
              duration: 560,
            },
          );
          void opening.finished
            .then(() => {
              if (token !== generation) return;
              const back = navigation.back;
              reset();
              const target =
                back && location.pathname === "/" && location.hash === "#work"
                  ? document.querySelector<HTMLElement>(
                      `a[href="${navigation.fromPath}"]`,
                    )
                  : (document
                      .getElementById(location.hash.slice(1))
                      ?.querySelector<HTMLElement>("h1, h2") ??
                    foreground()?.querySelector<HTMLElement>("h1"));
              if (target) {
                if (!target.matches("a, button")) target.tabIndex = -1;
                target.focus({ preventScroll: true });
              }
            })
            .catch(() => {});
        });
      });
    };
    const start = (
      url: URL,
      back: boolean,
      nextIndex: number,
      origin: string,
      navigate?: () => void,
    ) => {
      reset();
      const token = generation;
      prepareRouteScroll(url, back && url.hash === "#work");
      active = {
        url,
        index: nextIndex,
        back,
        covered: false,
        committed: false,
        revealing: false,
        origin,
        fromPath: current.pathname,
      };
      root.dataset.active = "true";
      root.dataset.direction = back ? "back" : "forward";
      root.dataset.phase = "leave";
      const wrapper = viewport();
      if (wrapper) wrapper.dataset.routeLock = "true";
      foreground()?.setAttribute("aria-busy", "true");
      tunnel.start(back);
      animate(
        passage,
        [
          { opacity: 0 },
          { opacity: 0.12, offset: 0.25 },
          { opacity: 1, offset: 0.78 },
          { opacity: 1 },
        ],
        { duration: 620 },
      );
      const page = foreground();
      const leaving =
        page && navigate
          ? animate(
              page,
              [
                {
                  transform: "scale(1) translate3d(0, 0, 0)",
                  opacity: 1,
                  transformOrigin: origin,
                },
                {
                  transform: back ? "scale(.98)" : "scale(.985)",
                  opacity: 0.95,
                  offset: 0.22,
                  transformOrigin: origin,
                },
                {
                  transform: back
                    ? "scale(.62) translate3d(2%, -1%, 0)"
                    : "scale(1.58) translate3d(-4%, 2%, 0)",
                  opacity: 0,
                  transformOrigin: origin,
                },
              ],
              { duration: 610 },
            )
          : null;
      const cover = animate(
        veil,
        [{ opacity: 0 }, { opacity: 0.05, offset: 0.35 }, { opacity: 1 }],
        { duration: 620 },
      );
      void cover.finished
        .then(() => {
          if (token !== generation || !active) return;
          active.covered = true;
          root.dataset.phase = "waiting";
          leaving?.cancel();
          navigate?.();
          reveal();
        })
        .catch(() => {});
      // A failed/cancelled route must never leave the page scroll-locked.
      timeout = window.setTimeout(reset, 12000);
    };
    commit.current = () => {
      if (
        active &&
        (location.pathname === active.url.pathname ||
          location.pathname !== current.pathname)
      ) {
        index = active.index;
        active.committed = true;
        stamp();
        reveal();
      } else if (location.pathname !== current.pathname) {
        index++;
        stamp();
      }
      current = new URL(location.href);
    };
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (!link || link.download || (link.target && link.target !== "_self"))
        return;
      const url = new URL(link.href, location.href);
      if (
        url.origin !== location.origin ||
        !relevant(new URL(location.href), url)
      )
        return;
      if (active) {
        event.preventDefault();
        return;
      }
      current = new URL(location.href);
      remember();
      stamp();
      const back = url.pathname === "/";
      if (motion.matches) {
        prepareRouteScroll(url, back && url.hash === "#work");
        return;
      }
      event.preventDefault();
      const box = link.getBoundingClientRect();
      const x = event.detail ? event.clientX : box.left + box.width / 2;
      const y = event.detail ? event.clientY : box.top + box.height / 2;
      const wrapper = viewport();
      const origin = `${Math.round(x)}px ${Math.round(y + (wrapper?.scrollTop ?? 0))}px`;
      start(url, back, index + 1, origin, () =>
        router.push(url.pathname + url.search + url.hash, { scroll: false }),
      );
    };
    const pop = (event: PopStateEvent) => {
      const url = new URL(location.href);
      // Browser history can interrupt either half of a transition, including
      // returning before the pending route has committed.
      if (active) reset();
      if (!relevant(current, url)) {
        prepareRouteScroll(url, true);
        current = url;
        return;
      }
      remember();
      const entryIndex = event.state?.[historyKey];
      const nextIndex = typeof entryIndex === "number" ? entryIndex : index - 1;
      const back = nextIndex < index;
      prepareRouteScroll(url, true);
      if (motion.matches) {
        index = nextIndex;
        return;
      }
      start(url, back, nextIndex, "50% 40%");
      // Browser forward also restores the destination's saved scroll position.
      prepareRouteScroll(url, true);
    };
    const block = (event: Event) => {
      if (active && !(event instanceof WheelEvent && event.ctrlKey))
        event.preventDefault();
    };
    const key = (event: KeyboardEvent) => {
      if (
        active &&
        [
          " ",
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End",
          "Tab",
        ].includes(event.key)
      )
        event.preventDefault();
    };
    const reduce = () => {
      if (!motion.matches || !active) return;
      const url = active.url;
      const needsNavigation = location.pathname !== url.pathname;
      reset();
      prepareRouteScroll(url, url.pathname === "/" && url.hash === "#work");
      if (needsNavigation)
        router.push(url.pathname + url.search + url.hash, { scroll: false });
    };
    document.addEventListener("click", click, true);
    window.addEventListener("popstate", pop, true);
    window.addEventListener("wheel", block, { capture: true, passive: false });
    window.addEventListener("touchmove", block, {
      capture: true,
      passive: false,
    });
    window.addEventListener("keydown", key, true);
    motion.addEventListener("change", reduce);
    return () => {
      reset();
      tunnel.destroy();
      commit.current = () => {};
      document.removeEventListener("click", click, true);
      window.removeEventListener("popstate", pop, true);
      window.removeEventListener("wheel", block, true);
      window.removeEventListener("touchmove", block, true);
      window.removeEventListener("keydown", key, true);
      motion.removeEventListener("change", reduce);
    };
  }, [router]);

  useLayoutEffect(() => {
    commit.current();
  }, [pathname]);

  return (
    <div
      ref={layer}
      className={styles.layer}
      data-route-transition
      data-active="false"
      data-phase="idle"
    >
      <div className={styles.veil} data-route-veil aria-hidden="true" />
      <canvas
        className={styles.passage}
        data-route-tunnel
        width="1"
        height="1"
        aria-hidden="true"
      />
      <span className={styles.status} role="status">
        페이지를 이동하고 있습니다
      </span>
    </div>
  );
}
