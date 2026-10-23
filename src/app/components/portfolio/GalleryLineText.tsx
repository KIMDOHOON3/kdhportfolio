"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./GalleryLineText.module.scss";

type Line = { text: string; height: number; top: number };
// Keep repeated font/resize notifications and detail returns from measuring
// every character again. Bound entries across viewport sizes during resizing.
const lineCache = new Map<string, Line[]>();
const cacheLimit = 192;

/** The source owns layout/accessibility; masked visual lines own motion. */
export default function GalleryLineText({ text }: { text: string }) {
  const source = useRef<HTMLSpanElement>(null);
  const visual = useRef<HTMLSpanElement>(null);
  const [lines, setLines] = useState<Line[]>([]);

  useLayoutEffect(() => {
    const element = source.current;
    if (!element) return;
    let disposed = false;
    let signature = "";
    let measuredKey = "";
    const measure = () => {
      const node = element.firstChild;
      if (disposed || !node || !element.clientWidth) return;
      const style = getComputedStyle(element);
      const fontReady = document.fonts.check(
        `${style.fontSize} ${style.fontFamily}`,
        text,
      );
      const measureKey = JSON.stringify([
        text,
        style.width,
        style.font,
        style.lineHeight,
        style.letterSpacing,
        style.wordSpacing,
        style.wordBreak,
        style.overflowWrap,
        style.whiteSpace,
        style.textTransform,
        style.fontFeatureSettings,
        style.fontVariationSettings,
        document.fonts.status,
        fontReady,
      ]);
      if (measureKey === measuredKey) return;
      measuredKey = measureKey;
      const apply = (next: Line[]) => {
        const key = JSON.stringify(next);
        if (key !== signature) {
          signature = key;
          setLines(next);
        }
      };
      const cached = fontReady && lineCache.get(measureKey);
      if (cached) {
        lineCache.delete(measureKey);
        lineCache.set(measureKey, cached);
        apply(cached);
        return;
      }
      const range = document.createRange();
      const groups: { top: number; text: string }[] = [];
      let offset = 0;
      for (const character of text) {
        range.setStart(node, offset);
        offset += character.length;
        range.setEnd(node, offset);
        const rect = range.getBoundingClientRect();
        if (!rect.width && /\s/.test(character)) continue;
        const previous = groups[groups.length - 1];
        if (previous && Math.abs(previous.top - rect.top) < 2)
          previous.text += character;
        else groups.push({ top: rect.top, text: character });
      }
      const height =
        parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
      const next = groups.map((line, index) => ({
        text: line.text.trim(),
        height,
        top: index * height,
      }));
      if (fontReady && document.fonts.status === "loaded") {
        lineCache.set(measureKey, next);
        if (lineCache.size > cacheLimit)
          lineCache.delete(lineCache.keys().next().value!);
      }
      apply(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    void document.fonts.ready.then(measure);
    document.fonts.addEventListener("loadingdone", measure);
    return () => {
      disposed = true;
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", measure);
    };
  }, [text]);

  return (
    <span
      className={styles.root}
      data-gallery-lines
      data-lines-ready={lines.length > 0}
    >
      <span ref={source} className={styles.source} data-gallery-line-source>
        {text}
      </span>
      <span ref={visual} className={styles.visual} aria-hidden="true">
        {lines.map((line, index) => (
          <span
            key={index}
            className={styles.line}
            data-gallery-line
            style={{ top: line.top, height: line.height } as CSSProperties}
          >
            <span
              className={styles.motion}
              data-line-motion
              data-gallery-reveal
              data-line-text={line.text}
            />
          </span>
        ))}
      </span>
    </span>
  );
}
