"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearRouteScroll,
  prepareRouteScroll,
  rememberRouteScroll,
} from "./routeScroll";
import styles from "./RouteTransition.module.scss";
import { beginGalleryFlight } from "./galleryBridge";
import type { GalleryFlight } from "./galleryScene";
import { rememberProjectRoute } from "./gallerySelection";

const projectPath = (path: string) => /^\/work\/\d+\/?$/.test(path);
const relevant = (from: URL, to: URL) =>
  from.pathname !== to.pathname &&
  (projectPath(from.pathname) || projectPath(to.pathname));
const easing = "cubic-bezier(.65,0,.25,1)";
const historyKey = "portfolioRouteIndex";
const leaveDuration = 150;
const enterDuration = 300;

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
      fromPath: string;
    } | null = null;
    let timeout = 0;
    let generation = 0;
    let frame = 0;
    let galleryFlight: GalleryFlight | null = null;
    let hiddenArrival: { element: HTMLElement; opacity: string } | null = null;
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
      galleryFlight?.cancel();
      galleryFlight = null;
      delete root.dataset.galleryFlight;
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      cancelAnimations();
      if (hiddenArrival) {
        hiddenArrival.element.style.opacity = hiddenArrival.opacity;
        hiddenArrival = null;
      }
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
          const returningCard =
            location.pathname === "/" && location.hash === "#work"
              ? document.querySelector<HTMLElement>(
                  `a[href="${navigation.fromPath}"]`,
                )
              : null;
          // Restore a complete card rather than replaying its entrances while
          // the returning page is still moving.
          returningCard?.focus({ preventScroll: true });
          if (galleryFlight) {
            const reverse = location.pathname === "/";
            const target = document.querySelector<HTMLElement>(
              reverse
                ? "[data-gallery-canvas]"
                : "[data-project-transition-cover]",
            );
            if (target) {
              if (page)
                animate(
                  page,
                  [
                    { opacity: 0, offset: 0 },
                    { opacity: 0, offset: reverse ? 0.32 : 0.55 },
                    { opacity: 1 },
                  ],
                  { duration: 1050, easing: "linear" },
                );
              void galleryFlight.arrive(target, reverse).then(() => {
                if (token !== generation) return;
                const destination = reverse
                  ? returningCard
                  : document.getElementById("project-title");
                reset();
                if (destination) {
                  if (!destination.matches("a,button"))
                    destination.tabIndex = -1;
                  destination.focus({ preventScroll: true });
                }
              });
              return;
            }
            galleryFlight.cancel();
            galleryFlight = null;
          }
          const arrivalOrigin = `50% ${Math.round((wrapper?.scrollTop ?? 0) + (wrapper?.clientHeight ?? innerHeight) * 0.45)}px`;
          const arrival = page
            ? animate(
                page,
                [
                  {
                    transform: navigation.back
                      ? "translate3d(0, -8px, 0) scale(1.014)"
                      : "translate3d(0, 10px, 0) scale(.982)",
                    opacity: 0,
                    transformOrigin: arrivalOrigin,
                  },
                  {
                    transform: "none",
                    opacity: 1,
                    transformOrigin: arrivalOrigin,
                  },
                ],
                {
                  duration: enterDuration,
                  easing: "cubic-bezier(.22,1,.36,1)",
                },
              )
            : null;
          const opening = animate(veil, [{ opacity: 1 }, { opacity: 0 }], {
            duration: enterDuration,
            easing: "cubic-bezier(.22,1,.36,1)",
          });
          // Both effects reach their final frame before restoring native
          // layout and scroll. There is no separate camera/preview clock.
          void Promise.all([opening.finished, arrival?.finished])
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
      navigate?: () => void,
      galleryEntry = false,
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
        fromPath: current.pathname,
      };
      root.dataset.active = "true";
      root.dataset.direction = back ? "back" : "forward";
      root.dataset.phase = "leave";
      const wrapper = viewport();
      if (wrapper) wrapper.dataset.routeLock = "true";
      foreground()?.setAttribute("aria-busy", "true");
      const page = foreground();
      const departingHero =
        url.pathname === "/"
          ? document.querySelector<HTMLElement>(
              "[data-project-transition-cover]",
            )
          : null;
      // A shared image can only lead back from what the user can actually see.
      // Reading lower in a detail must not fly in an offscreen hero rectangle.
      const heroBounds = departingHero?.getBoundingClientRect();
      const headerBottom =
        document
          .querySelector("[data-scroll-viewport] > div > header")
          ?.getBoundingClientRect().bottom ?? 0;
      const visibleHeroHeight = heroBounds
        ? Math.max(
            0,
            Math.min(heroBounds.bottom, innerHeight) -
              Math.max(heroBounds.top, headerBottom),
          )
        : 0;
      const visibleHeroWidth = heroBounds
        ? Math.max(
            0,
            Math.min(heroBounds.right, innerWidth) -
              Math.max(heroBounds.left, 0),
          )
        : 0;
      const visibleHero =
        !!heroBounds &&
        heroBounds.width > 1 &&
        heroBounds.height > 1 &&
        visibleHeroHeight >= heroBounds.height * 0.4 &&
        visibleHeroWidth >= heroBounds.width * 0.6;
      if (galleryEntry || visibleHero)
        galleryFlight = beginGalleryFlight(
          root,
          departingHero ?? undefined,
          Number(
            (projectPath(url.pathname) ? url.pathname : current.pathname)
              .split("/")
              .pop(),
          ),
        );
      if (galleryFlight) {
        root.dataset.galleryFlight = "true";
        if (page)
          animate(page, [{ opacity: 1 }, { opacity: 0 }], { duration: 180 });
        active.covered = true;
        navigate?.();
        reveal();
        timeout = window.setTimeout(reset, 12000);
        return;
      }
      const duration = leaveDuration;
      const origin = `50% ${Math.round((wrapper?.scrollTop ?? 0) + (wrapper?.clientHeight ?? innerHeight) * 0.45)}px`;
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
                  transform: back
                    ? "translate3d(0, 6px, 0) scale(.986)"
                    : "translate3d(0, -8px, 0) scale(1.022)",
                  opacity: 0,
                  transformOrigin: origin,
                },
              ],
              { duration, easing: "cubic-bezier(.4,0,.8,1)" },
            )
          : null;
      const cover = animate(veil, [{ opacity: 0 }, { opacity: 1 }], {
        duration,
        easing: "cubic-bezier(.4,0,.8,1)",
      });
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
        if (galleryFlight && !active.committed) {
          // Hide the incoming content in the commit's layout effect, before
          // the two measurement frames. The outgoing opacity animation must
          // not briefly reveal a new title underneath the moving surface.
          cancelAnimations();
          const page = foreground();
          if (page) {
            hiddenArrival = { element: page, opacity: page.style.opacity };
            page.style.opacity = "0";
          }
        }
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
      const galleryEntry = !!link.closest("[data-project-gallery]");
      start(
        url,
        back,
        index + 1,
        () =>
          router.push(url.pathname + url.search + url.hash, { scroll: false }),
        galleryEntry,
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
      start(
        url,
        back,
        nextIndex,
        undefined,
        current.pathname === "/" && projectPath(url.pathname),
      );
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
    rememberProjectRoute(pathname);
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
      <span className={styles.status} role="status">
        페이지를 이동하고 있습니다
      </span>
    </div>
  );
}
