"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { observeEntrance } from "./entranceObserver";
import styles from "./CopyReveal.module.scss";

/** Original text owns layout and accessibility; the overlay only animates. */
export default function CopyReveal({
  children,
  seen = false,
  delay = 0,
  inline = false,
}: {
  children: string;
  seen?: boolean;
  delay?: number;
  inline?: boolean;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const source = useRef<HTMLSpanElement>(null);
  const [lines, setLines] = useState<string[]>([]);

  useLayoutEffect(() => {
    const element = root.current;
    const textElement = source.current;
    if (!element || !textElement) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let unsubscribe = () => {};
    let resize: ResizeObserver | undefined;
    let cancelled = false;
    let preparing = false;
    let width = textElement.offsetWidth;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      element.dataset.copyEntrance = "done";
      unsubscribe();
      resize?.disconnect();
      clearTimeout(fallback);
      setLines([]);
    };
    const start = async () => {
      if (preparing || element.dataset.copyEntrance !== "pending") return;
      preparing = true;
      await document.fonts.ready;
      if (cancelled || element.dataset.copyEntrance !== "pending") return;
      // Measure real line breaks once, never on animation or scroll frames.
      const node = textElement.firstChild;
      if (!node || node.nodeType !== Node.TEXT_NODE) return finish();
      const range = document.createRange();
      const font = getComputedStyle(textElement);
      const lineHeight =
        parseFloat(font.lineHeight) || parseFloat(font.fontSize) * 1.2;
      const measured: string[] = [];
      let line = "";
      let center: number | undefined;
      for (let index = 0; index < children.length; index++) {
        range.setStart(node, index);
        range.setEnd(node, index + 1);
        const rect = range.getBoundingClientRect();
        const nextCenter = rect.top + rect.height * 0.5;
        // Mixed NewYork/Korean glyphs have different ascenders on the same line.
        if (
          rect.width &&
          center !== undefined &&
          Math.abs(nextCenter - center) > lineHeight * 0.55
        ) {
          measured.push(line.trim());
          line = "";
        }
        if (rect.width) center = nextCenter;
        line += children[index];
      }
      if (line.trim()) measured.push(line.trim());
      if (!measured.length) return finish();
      setLines(measured);
      element.dataset.copyEntrance = "playing";
      unsubscribe();
      fallback = setTimeout(
        finish,
        1000 + delay + Math.min(measured.length * 45, 225),
      );
    };
    if (seen || motion.matches) finish();
    else {
      element.dataset.copyEntrance = "pending";
      unsubscribe = observeEntrance(element, () => {
        void start();
      });
      // On width changes restore ordinary text instead of using stale line breaks.
      resize = new ResizeObserver(() => {
        if (textElement.offsetWidth !== width) {
          width = textElement.offsetWidth;
          if (element.dataset.copyEntrance === "playing") finish();
        }
      });
      resize.observe(textElement);
    }
    const complete = (event: AnimationEvent) => {
      if ((event.target as HTMLElement).hasAttribute("data-copy-last"))
        finish();
    };
    const reduce = () => {
      if (motion.matches) finish();
    };
    const focusTarget = element.closest("a") ?? element;
    focusTarget.addEventListener("focusin", finish);
    element.addEventListener("animationend", complete);
    motion.addEventListener("change", reduce);
    return () => {
      cancelled = true;
      clearTimeout(fallback);
      unsubscribe();
      resize?.disconnect();
      focusTarget.removeEventListener("focusin", finish);
      element.removeEventListener("animationend", complete);
      motion.removeEventListener("change", reduce);
    };
  }, [children, seen, delay]);

  return (
    <span
      ref={root}
      className={styles.copy}
      data-copy-reveal
      data-copy-inline={inline ? "" : undefined}
      data-copy-entrance="static"
    >
      <span ref={source} className={styles.source}>
        {children}
      </span>
      {!!lines.length && (
        <span className={styles.overlay} aria-hidden="true">
          {lines.map((line, index) => (
            <span className={styles.line} key={index}>
              <span
                className={styles.mover}
                data-copy-last={index === lines.length - 1 ? "" : undefined}
                style={
                  {
                    "--line-delay": `${delay + Math.min(index * 45, 225)}ms`,
                  } as CSSProperties
                }
              >
                {line}
              </span>
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
