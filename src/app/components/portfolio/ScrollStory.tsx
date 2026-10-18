"use client";

import { useEffect, useRef } from "react";
import {
  getScrollViewport,
  readScroll,
  subscribeScroll,
} from "./ScrollViewport";
import JourneySkills from "./JourneySkills";
import { JOURNEY } from "@/app/data/journey";
import { DownloadIcon } from "../Icons";
import styles from "./Journey.module.scss";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function JourneyHeading({ preview = false }: { preview?: boolean }) {
  return (
    <div className={styles.heading}>
      <p className={styles.eyebrow}>EXPERIENCE & EDUCATION</p>
      <h2 id={preview ? undefined : "journey-title"}>
        퍼블리싱에서 시작해
        <br />
        프론트엔드로.
      </h2>
      <p className={styles.intro}>화면과 기능을 함께 만들어온 과정입니다.</p>
    </div>
  );
}

function JourneyAside({ preview = false }: { preview?: boolean }) {
  return (
    <aside className={styles.aside}>
      <JourneyHeading preview={preview} />
      <nav
        className={styles.chapterNav}
        data-journey-nav={preview ? undefined : ""}
        aria-label={preview ? undefined : "성장 과정 바로가기"}
      >
        {JOURNEY.map((chapter, index) => (
          <a
            key={chapter.id}
            href={`#journey-${chapter.id}`}
            tabIndex={preview ? -1 : undefined}
            aria-current={index === 0 ? "step" : undefined}
          >
            <span>{chapter.year}</span>
            <span>{chapter.label}</span>
          </a>
        ))}
      </nav>
      <a
        href="/resume/김도훈-이력서.pdf"
        download
        tabIndex={preview ? -1 : undefined}
        className={styles.resume}
      >
        이력서 내려받기{" "}
        <DownloadIcon
          width={17}
          height={17}
          fill="currentColor"
          aria-hidden="true"
        />
      </a>
    </aside>
  );
}

function ChapterContent({
  chapter,
  index,
}: {
  chapter: (typeof JOURNEY)[number];
  index: number;
}) {
  return (
    <>
      <div className={styles.chapterTop}>
        <p className={styles.year}>{chapter.year}</p>
        <span className={styles.chapterNumber}>
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <h3>{chapter.title}</h3>
      <p className={styles.organization}>{chapter.organization}</p>
      <p className={styles.description}>{chapter.description}</p>
      <ul className={styles.details}>
        {chapter.details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
    </>
  );
}

export default function ScrollStory() {
  const root = useRef<HTMLElement>(null);
  const portal = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const ending = useRef<HTMLDivElement>(null);
  const connection = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const section = root.current;
    const browser = portal.current;
    const content = body.current;
    const source = document.querySelector<SVGSVGElement>(
      "[data-interface-sketch]",
    );
    if (!section || !browser || !content || !source) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    const cards = [
      ...section.querySelectorAll<HTMLElement>("[data-journey-chapter]"),
    ];
    const links = [
      ...section.querySelectorAll<HTMLAnchorElement>("[data-journey-nav] a"),
    ];
    const dock = content.querySelector<HTMLElement>("[data-journey-skills]");
    const line = section.querySelector<HTMLElement>("[data-journey-line]");
    const outro = ending.current;
    const drawing = connection.current;
    const paths = [
      ...(drawing?.querySelectorAll<SVGPathElement>("[data-connection-path]") ??
        []),
    ];
    const viewport = getScrollViewport();
    const data = (
      element: HTMLElement | SVGElement,
      key: string,
      value: string,
    ) => {
      if (element.dataset[key] !== value) element.dataset[key] = value;
    };
    const style = (
      element: HTMLElement | SVGElement,
      key: string,
      value: string,
    ) => {
      if (element.style.getPropertyValue(key) !== value)
        element.style.setProperty(key, value);
    };
    let layout: {
      top: number;
      height: number;
      width: number;
      headerBottom: number;
      source: { top: number; left: number; width: number; height: number };
      contentBottom: number;
      dockTop: number;
      dockSticky: number;
      dockHeight: number;
      lineTop: number;
      lineHeight: number;
      endingHeight: number;
      cardTops: number[];
    };
    const measure = () => {
      const scroll = readScroll();
      const rect = section.getBoundingClientRect();
      const sketch = source.getBoundingClientRect();
      const page = content.getBoundingClientRect();
      const lineRect = line?.getBoundingClientRect();
      const area = outro?.getBoundingClientRect();
      const dockStyle = dock ? getComputedStyle(dock) : null;
      layout = {
        top: rect.top + scroll.top,
        height: rect.height,
        width: document.documentElement.clientWidth,
        headerBottom:
          document.querySelector("header")?.getBoundingClientRect().bottom ??
          80,
        source: {
          top: sketch.top + scroll.top,
          left: sketch.left,
          width: sketch.width,
          height: sketch.height,
        },
        contentBottom: page.bottom + scroll.top,
        dockTop:
          page.top +
          scroll.top +
          parseFloat(getComputedStyle(content).paddingTop),
        dockSticky: parseFloat(dockStyle?.top ?? "0") || 0,
        dockHeight: dock?.offsetHeight ?? 100,
        lineTop: (lineRect?.top ?? 0) + scroll.top,
        lineHeight: lineRect?.height ?? 1,
        endingHeight: area?.height ?? 1,
        cardTops: cards.map(
          (card) => card.getBoundingClientRect().top + scroll.top,
        ),
      };
      // Curves depend on layout, not scroll progress. Keep their geometry stable
      // while only the dash offset animates.
      if (area && lineRect) {
        const origin = lineRect.left - area.left;
        const center = area.width * 0.5;
        const junction = Math.min(108, area.height * 0.2);
        paths.forEach((path, index) => {
          const target = area.width * (0.04 + index * 0.153333);
          const bend = target < center ? -1 : 1;
          const spread = Math.abs(index - 3) / 3;
          path.setAttribute(
            "d",
            `M ${origin} 0 C ${origin} ${junction * 0.55}, ${center} ${junction * 0.35}, ${center} ${junction} C ${center} ${junction + 80}, ${center + bend * (area.width * 0.18 + spread * area.width * 0.12)} ${area.height * 0.42}, ${target} ${area.height + 10}`,
          );
        });
      }
    };
    const update = ({
      height,
      top: scrollTop,
    }: {
      height: number;
      top: number;
    }) => {
      if (disposed) return;
      const top = layout.top - scrollTop;
      const { width, headerBottom } = layout;
      const rect = layout.source;
      const sourceOffset = rect.top - layout.top;
      const entryStart = Math.max(
        height * 0.65,
        headerBottom + 40 - sourceOffset,
      );
      const progress = motion.matches
        ? 1
        : clamp((entryStart - top) / (entryStart + height * 0.7));
      const eased = smooth(progress);
      // Freeze the starting rectangle in viewport space while scrolling into it.
      const sourceTop = sourceOffset + entryStart;
      const x = mix(rect.left, -1, eased);
      const y = mix(sourceTop, -40, eased);
      const w = mix(rect.width, width + 2, eased);
      const h = mix(rect.height, height + 42, eased);
      style(browser, "--browser-x", `${x}px`);
      style(browser, "--browser-y", `${y}px`);
      style(browser, "--browser-width", `${w}px`);
      style(browser, "--browser-height", `${h}px`);
      style(browser, "--browser-radius", `${mix(12, 0, eased)}px`);
      style(browser, "--preview-width", `${width}px`);
      style(browser, "--preview-scale", String(w / width));
      style(browser, "--cursor-opacity", String(1 - smooth(progress / 0.28)));
      style(browser, "--browser-shadow", String((1 - eased) * 0.13));
      style(browser, "--page-reveal", String(smooth((progress - 0.24) / 0.4)));
      style(browser, "--diagram-opacity", String(1 - smooth(progress / 0.34)));
      style(browser, "--click-scale", String(1 + progress * 16));
      const hidden = motion.matches || progress <= 0 || progress >= 1;
      if (browser.hidden !== hidden) browser.hidden = hidden;
      style(
        source,
        "opacity",
        progress > 0 && progress < 1 && !motion.matches ? "0" : "1",
      );
      data(section, "entered", String(progress >= 1));
      data(
        section,
        "phase",
        motion.matches
          ? "static"
          : progress <= 0
            ? "before"
            : progress < 1
              ? "entering"
              : "inside",
      );
      data(section, "entryProgress", progress.toFixed(4));
      data(section, "ready", "true");
      if (viewport)
        data(
          viewport,
          "journeyActive",
          String(top < entryStart && top + layout.height > headerBottom),
        );
      const dockTop = Math.min(
        Math.max(layout.dockTop - scrollTop, layout.dockSticky),
        layout.contentBottom - scrollTop - layout.dockHeight,
      );
      const threshold = dockTop + layout.dockHeight + 100;
      let active = 0;
      cards.forEach((card, index) => {
        const cardTop = layout.cardTops[index] - scrollTop;
        if (cardTop <= threshold) active = index;
        data(
          card,
          "revealed",
          String(motion.matches || cardTop < height * 0.94),
        );
      });
      data(section, "chapter", String(active));
      cards.forEach((card, index) =>
        data(card, "active", String(index === active)),
      );
      links.forEach((link, index) => {
        if (index === active && !link.hasAttribute("aria-current"))
          link.setAttribute("aria-current", "step");
        else if (index !== active && link.hasAttribute("aria-current"))
          link.removeAttribute("aria-current");
      });
      if (line) {
        const lineTop = layout.lineTop - scrollTop;
        const lineBottom = lineTop + layout.lineHeight;
        style(
          line,
          "--line-progress",
          String(
            motion.matches
              ? 1
              : clamp((threshold - lineTop) / Math.max(1, layout.lineHeight)),
          ),
        );
        if (outro && drawing) {
          const travel = motion.matches
            ? 1
            : clamp((threshold - lineBottom) / (layout.endingHeight * 0.85));
          style(drawing, "visibility", travel > 0 ? "visible" : "hidden");
          style(
            outro,
            "--connection-wash",
            String(smooth((travel - 0.25) / 0.75)),
          );
          data(outro, "progress", travel.toFixed(4));
          paths.forEach((path, index) => {
            style(
              path,
              "stroke-dashoffset",
              String(1 - smooth(travel * 1.3 - index * 0.035)),
            );
          });
        }
      }
    };
    section.dataset.enhanced = String(!motion.matches);
    measure();
    const unsubscribe = subscribeScroll(update);
    const resize = () => {
      if (disposed) return;
      section.dataset.enhanced = String(!motion.matches);
      measure();
      update(readScroll());
    };
    const observer = new ResizeObserver(resize);
    observer.observe(source);
    observer.observe(section);
    observer.observe(content);
    const scrollContent = document.querySelector("[data-scroll-content]");
    if (scrollContent) observer.observe(scrollContent);
    window.addEventListener("resize", resize);
    motion.addEventListener("change", resize);
    document.fonts.ready.then(() => {
      if (!disposed) resize();
    });
    return () => {
      disposed = true;
      unsubscribe();
      observer.disconnect();
      window.removeEventListener("resize", resize);
      motion.removeEventListener("change", resize);
      source.style.removeProperty("opacity");
      getScrollViewport()?.removeAttribute("data-journey-active");
    };
  }, []);

  return (
    <section
      ref={root}
      className={styles.journey}
      data-scroll-story
      data-journey
      data-enhanced="false"
      data-entered="true"
      data-ready="false"
      aria-labelledby="journey-title"
    >
      <div className={styles.runway} aria-hidden="true" />
      <div
        ref={portal}
        className={styles.browser}
        data-browser-entry
        hidden
        aria-hidden="true"
      >
        <div className={styles.browserChrome}>
          <i />
          <i />
          <i />
          <span>dohoon / my journey</span>
          <b>↗</b>
        </div>
        <div className={styles.previewViewport}>
          <svg
            className={styles.previewDiagram}
            viewBox="0 0 432 268"
            preserveAspectRatio="none"
          >
            <path
              d="M106 0V268 M25 28H77 M25 50H66 M25 92H76 M25 115H69 M25 138H81"
              fill="none"
              stroke="#425463"
              strokeWidth="1.8"
            />
            <rect
              x="130"
              y="25"
              width="279"
              height="100"
              rx="6"
              fill="#d9e6f3"
              stroke="#425463"
              strokeWidth="1.8"
            />
            <rect x="148" y="44" width="107" height="8" rx="4" fill="#4b74b1" />
            <path
              d="M148 66H309 M148 79H288"
              stroke="#6686a5"
              strokeWidth="5"
              opacity=".45"
            />
            <rect x="148" y="94" width="58" height="13" rx="6" fill="#4b74b1" />
            <rect
              x="130"
              y="148"
              width="128"
              height="90"
              rx="6"
              fill="#e4edf6"
              stroke="#425463"
              strokeWidth="1.8"
            />
            <rect
              x="280"
              y="148"
              width="129"
              height="90"
              rx="6"
              fill="#f9f8f3"
              stroke="#425463"
              strokeWidth="1.8"
            />
            <path
              d="m148 202 20-18 19 11 26-28 26 11"
              fill="none"
              stroke="#4b74b1"
              strokeWidth="3"
            />
            <path
              d="M297 170H369 M297 183H388 M297 196H376"
              stroke="#7c8c98"
              strokeWidth="4"
              opacity=".4"
            />
          </svg>
          <div className={styles.previewPage}>
            <JourneySkills decorative />
            <div className={styles.previewLayout}>
              <JourneyAside preview />
              <div className={styles.timeline}>
                <div className={styles.chapter}>
                  <ChapterContent chapter={JOURNEY[0]} index={0} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <svg className={styles.enterCursor} viewBox="0 0 40 45">
          <path
            d="M4 3 12 37 20 25 35 22Z"
            fill="#3385dd"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        <span className={styles.entryClick} />
      </div>
      <div ref={body} className={styles.page} data-journey-page>
        <JourneySkills />
        <div className={styles.layout}>
          <JourneyAside />
          <ol className={styles.timeline} data-journey-line>
            {JOURNEY.map((chapter, index) => (
              <li
                key={chapter.id}
                id={`journey-${chapter.id}`}
                className={styles.chapter}
                data-journey-chapter
                data-revealed="true"
                data-active={index === 0}
              >
                <span className={styles.milestone} aria-hidden="true">
                  <span />
                </span>
                <ChapterContent chapter={chapter} index={index} />
              </li>
            ))}
          </ol>
        </div>
        <div ref={ending} className={styles.ending} data-journey-ending>
          <svg
            ref={connection}
            className={styles.connection}
            aria-hidden="true"
            data-journey-connection
          >
            <defs>
              <linearGradient
                id="journey-connection-ink"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0" stopColor="#3978b7" />
                <stop offset="0.7" stopColor="#619bd2" stopOpacity=".65" />
                <stop offset="1" stopColor="#7cb5df" stopOpacity="0" />
              </linearGradient>
            </defs>
            {Array.from({ length: 7 }, (_, index) => (
              <path key={index} data-connection-path pathLength="1" />
            ))}
          </svg>
          <div className={styles.endingCopy}>
            <span>Contact me</span>
            <p>
              함께 일하고 싶은 프론트엔드 개발자
              <br />
              찾고 계신가요?
            </p>
            <a href="mailto:kingyska@nate.com">언제든 연락주세요! ↗</a>
          </div>
        </div>
      </div>
    </section>
  );
}
