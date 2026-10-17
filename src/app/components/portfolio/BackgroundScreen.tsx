"use client";

import { useEffect, useRef } from "react";
import { subscribeScroll } from "./ScrollViewport";
import styles from "./Portfolio.module.scss";

export default function BackgroundScreen() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      subscribeScroll(({ height }) => {
        const heroBottom =
          document.querySelector("[data-hero]")?.getBoundingClientRect()
            .bottom ?? height;
        const footerTop =
          document.getElementById("contact")?.getBoundingClientRect().top ??
          height;
        const alpha =
          Math.min(1, Math.max(0, (height - heroBottom) / (height * 0.75))) *
          Math.min(1, Math.max(0, footerTop / height));
        ref.current?.style.setProperty("--screen-radius", `${3.6 * alpha}px`);
        if (ref.current) ref.current.dataset.progress = String(alpha);
        document
          .querySelector<HTMLElement>("[data-glass-scene]")
          ?.style.setProperty("--fallback-opacity", heroBottom > 0 ? "1" : "0");
      }),
    [],
  );
  return (
    <div
      ref={ref}
      className={styles.backgroundScreen}
      data-background-screen
      aria-hidden="true"
    />
  );
}
