"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { observeEntrance } from "./entranceObserver";
import styles from "./ProjectCoverEntrance.module.scss";

export default function ProjectCoverEntrance({
  children,
  projectId,
  seen,
  onStart,
}: {
  children: ReactNode;
  projectId: number;
  seen: boolean;
  onStart: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const started = useRef(onStart);
  started.current = onStart;
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let unsubscribe = () => {};
    let inView = false;
    const images = [...element.querySelectorAll("img")];
    const finish = () => {
      element.dataset.coverEntrance = "done";
      unsubscribe();
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
      const planned = Number(element.dataset.entranceAt ?? performance.now());
      element.style.setProperty(
        "--entrance-delay",
        `${Math.max(0, planned - performance.now())}ms`,
      );
      unsubscribe();
      started.current();
    };
    if (seen || motion.matches) finish();
    else {
      element.dataset.coverEntrance = "pending";
      unsubscribe = observeEntrance(element, () => {
        inView = true;
        start();
      });
    }
    images.forEach((image) => {
      image.addEventListener("load", start);
      image.addEventListener("error", start);
    });
    const complete = (event: AnimationEvent) => {
      if ((event.target as HTMLElement).hasAttribute("data-paper-cover"))
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
      unsubscribe();
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
    >
      {children}
    </div>
  );
}
