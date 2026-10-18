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
            .bottom ?? 0;
        const footer = document
          .getElementById("contact")
          ?.getBoundingClientRect();
        const footerTop = footer?.top ?? height;
        // A compact footer cannot reach the top of a tall viewport. Reveal
        // its glass fully once the complete footer fits above the fold.
        const footerReveal = Math.min(
          1,
          Math.max(
            0,
            (height - footerTop) /
              Math.max(1, Math.min(height, footer?.height ?? height)),
          ),
        );
        const ending = document
          .querySelector("[data-journey-ending]")
          ?.getBoundingClientRect();
        const connectionReveal = ending
          ? Math.min(
              1,
              Math.max(
                0,
                (height * 0.82 - ending.top) /
                  Math.max(1, ending.height * 0.85),
              ),
            )
          : 0;
        const alpha =
          Math.min(1, Math.max(0, (height - heroBottom) / (height * 0.75))) *
          (1 - Math.max(footerReveal, connectionReveal));
        const progress = Math.min(1, Math.max(0, (alpha - 0.12) / 0.72));
        const opacity = progress * progress * (3 - 2 * progress);
        ref.current?.style.setProperty("--screen-opacity", String(opacity));
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
