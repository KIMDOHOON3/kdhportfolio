"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { subscribeScroll } from "./ScrollViewport";
import styles from "./Portfolio.module.scss";

export default function BackgroundScreen() {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(
    () =>
      subscribeScroll(
        ({
          height,
          heroBottom,
          footerTop,
          footerHeight,
          endingTop,
          endingHeight,
        }) => {
          // A compact footer cannot reach the top of a tall viewport. Reveal
          // its glass fully once the complete footer fits above the fold.
          const footerReveal = Math.min(
            1,
            Math.max(
              0,
              (height - footerTop) /
                Math.max(1, Math.min(height, footerHeight)),
            ),
          );
          const connectionReveal =
            endingTop !== null
              ? Math.min(
                  1,
                  Math.max(
                    0,
                    (height * 0.82 - endingTop) /
                      Math.max(1, endingHeight * 0.85),
                  ),
                )
              : 0;
          const alpha =
            Math.min(1, Math.max(0, (height - heroBottom) / (height * 0.75))) *
            (1 - Math.max(footerReveal, connectionReveal));
          const progress = Math.min(1, Math.max(0, (alpha - 0.12) / 0.72));
          const opacity = progress * progress * (3 - 2 * progress);
          const screen = ref.current;
          const value = opacity.toFixed(4);
          if (
            screen &&
            screen.style.getPropertyValue("--screen-opacity") !== value
          )
            screen.style.setProperty("--screen-opacity", value);
          const progressValue = alpha.toFixed(4);
          if (screen && screen.dataset.progress !== progressValue)
            screen.dataset.progress = progressValue;
          const glass =
            document.querySelector<HTMLElement>("[data-glass-scene]");
          const fallback = heroBottom > 0 ? "1" : "0";
          if (
            glass &&
            glass.style.getPropertyValue("--fallback-opacity") !== fallback
          )
            glass.style.setProperty("--fallback-opacity", fallback);
        },
      ),
    [pathname],
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
