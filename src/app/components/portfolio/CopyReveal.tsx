"use client";

import { useLayoutEffect, useRef } from "react";
import { observeEntrance } from "./entranceObserver";
import styles from "./CopyReveal.module.scss";

/** Keep each reading unit intact, using the same lift as the hero copy. */
export default function CopyReveal({
  children,
  seen = false,
  inline = false,
}: {
  children: string;
  seen?: boolean;
  inline?: boolean;
}) {
  const root = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let unsubscribe = () => {};
    const finish = () => {
      element.dataset.copyEntrance = "done";
      unsubscribe();
    };
    if (seen || motion.matches) finish();
    else {
      element.dataset.copyEntrance = "pending";
      unsubscribe = observeEntrance(element, () => {
        element.dataset.copyEntrance = "playing";
      });
    }
    const complete = (event: AnimationEvent) => {
      if (event.target === element) finish();
    };
    const reduce = () => {
      if (motion.matches) finish();
    };
    const link = element.closest("a, button") ?? element;
    element.addEventListener("animationend", complete);
    link.addEventListener("focusin", finish);
    motion.addEventListener("change", reduce);
    return () => {
      unsubscribe();
      element.removeEventListener("animationend", complete);
      link.removeEventListener("focusin", finish);
      motion.removeEventListener("change", reduce);
    };
  }, [children, seen]);
  return (
    <span
      ref={root}
      className={styles.copy}
      data-copy-reveal
      data-copy-inline={inline ? "" : undefined}
      data-copy-entrance="static"
    >
      <span className={styles.source}>{children}</span>
    </span>
  );
}
