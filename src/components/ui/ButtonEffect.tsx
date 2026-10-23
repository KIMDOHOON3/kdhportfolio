"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import styles from "./ButtonEffect.module.scss";
import "./ButtonEffect.scss";

let visibility: IntersectionObserver | undefined;
const lights = new Map<HTMLElement, boolean>();
const syncVisibility = () => {
  lights.forEach((intersects, light) => {
    light.dataset.visible = String(intersects && !document.hidden);
  });
};

/** One observer for every action; no pointer-move reads or animation RAF. */
export function ButtonLight() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const light = ref.current;
    if (!light) return;
    visibility ??= new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        lights.set(target, entry.isIntersecting);
        target.dataset.visible = String(
          entry.isIntersecting && !document.hidden,
        );
      }
    });
    if (!lights.size)
      document.addEventListener("visibilitychange", syncVisibility);
    lights.set(light, false);
    visibility.observe(light);
    return () => {
      visibility?.unobserve(light);
      lights.delete(light);
      if (!lights.size) {
        visibility?.disconnect();
        visibility = undefined;
        document.removeEventListener("visibilitychange", syncVisibility);
      }
    };
  }, []);
  return (
    <i
      ref={ref}
      className={styles.light}
      data-button-light
      data-visible="false"
      aria-hidden="true"
    />
  );
}

export function ButtonLabel({
  children,
  className = "",
  wrap = false,
}: {
  children: string;
  className?: string;
  wrap?: boolean;
}) {
  let letterIndex = 0;
  const letters = (text: string) =>
    Array.from(text).map((character) => {
      const index = letterIndex++;
      return (
        <span key={index} style={{ "--letter-index": index } as CSSProperties}>
          {character === " " ? "\u00a0" : character}
        </span>
      );
    });
  return (
    <span className={`${styles.label} ${className}`} data-button-label>
      <span className={styles.accessible}>{children}</span>
      {wrap ? (
        <span className={styles.words} aria-hidden="true">
          {children.split(/(\s+)/).map((part, index) => {
            if (/^\s+$/.test(part)) {
              letterIndex += part.length;
              return part;
            }
            return (
              <span className={styles.word} key={index}>
                <span className={styles.letters}>{letters(part)}</span>
              </span>
            );
          })}
        </span>
      ) : (
        <span className={styles.letters} aria-hidden="true">
          {letters(children)}
        </span>
      )}
    </span>
  );
}
