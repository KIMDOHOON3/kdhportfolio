"use client";

import { useLayoutEffect, type RefObject } from "react";
import { observeEntrance } from "./entranceObserver";
import styles from "./ElementEntrance.module.scss";

/** Decorate existing elements, preserving flex/grid structure and interactive children. */
export default function useElementEntrances(
  root: RefObject<HTMLElement | null>,
  refresh?: string,
) {
  useLayoutEffect(() => {
    const host = root.current;
    if (!host) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const elements = [
      ...host.querySelectorAll<HTMLElement>("[data-element-reveal]"),
    ];
    const disposers = elements.map((element) => {
      let unsubscribe = () => {};
      const finish = () => {
        element.dataset.elementState = "done";
        unsubscribe();
      };
      const complete = (event: AnimationEvent) => {
        if (event.target === element) finish();
      };
      const reduce = () => {
        if (motion.matches) finish();
      };
      element.classList.add(styles.item);
      if (
        motion.matches ||
        element.dataset.elementState === "done" ||
        element.dataset.elementSeen === "true"
      )
        finish();
      else {
        element.dataset.elementState = "pending";
        unsubscribe = observeEntrance(element, () => {
          element.dataset.elementState = "playing";
        });
      }
      element.addEventListener("animationend", complete);
      const control = element.closest("a, button") ?? element;
      control.addEventListener("focusin", finish);
      motion.addEventListener("change", reduce);
      return () => {
        unsubscribe();
        element.removeEventListener("animationend", complete);
        control.removeEventListener("focusin", finish);
        motion.removeEventListener("change", reduce);
      };
    });
    return () => disposers.forEach((dispose) => dispose());
  }, [root, refresh]);
}
