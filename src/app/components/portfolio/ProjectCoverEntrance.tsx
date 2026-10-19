"use client";

import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { getScrollViewport } from "./ScrollViewport";
import styles from "./ProjectCoverEntrance.module.scss";

export default function ProjectCoverEntrance({
  children,
  projectId,
  seen,
  follow = false,
  onStart,
}: {
  children: ReactNode;
  projectId: number;
  seen: boolean;
  follow?: boolean;
  onStart: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const started = useRef(onStart);
  started.current = onStart;
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    let inView = false;
    const images = [...element.querySelectorAll("img")];
    const finish = () => {
      element.dataset.coverEntrance = "done";
      observer?.disconnect();
      started.current();
    };
    const start = () => {
      if (
        !inView ||
        !images.every((image) => image.complete) ||
        element.dataset.coverEntrance !== "pending"
      )
        return;
      element.dataset.coverEntrance = "playing";
      observer?.disconnect();
      started.current();
    };
    if (seen || motion.matches) finish();
    else {
      element.dataset.coverEntrance = "pending";
      observer = new IntersectionObserver(
        (entries) => {
          inView = entries.some(
            (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.16,
          );
          start();
        },
        {
          root: getScrollViewport(),
          rootMargin: "0px 0px -24px 0px",
          threshold: 0.16,
        },
      );
      observer.observe(element);
    }
    images.forEach((image) => {
      image.addEventListener("load", start);
      image.addEventListener("error", start);
    });
    const complete = (event: AnimationEvent) => {
      if ((event.target as HTMLElement).hasAttribute("data-cover-reflection"))
        finish();
    };
    const reduce = () => {
      if (motion.matches) finish();
    };
    const link = element.closest("a") ?? element;
    link.addEventListener("focusin", finish);
    element.addEventListener("animationend", complete);
    motion.addEventListener("change", reduce);
    return () => {
      observer?.disconnect();
      images.forEach((image) => {
        image.removeEventListener("load", start);
        image.removeEventListener("error", start);
      });
      link.removeEventListener("focusin", finish);
      element.removeEventListener("animationend", complete);
      motion.removeEventListener("change", reduce);
    };
  }, [seen]);
  return (
    <div
      ref={root}
      className={styles.frame}
      data-cover-entrance="static"
      data-cover-project={projectId}
      data-cover-follow={follow ? "" : undefined}
      style={
        {
          "--entry-side": follow ? 1 : -1,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
