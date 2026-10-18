"use client";

import { useEffect, useRef } from "react";
import { getScrollViewport, subscribeScroll } from "./ScrollViewport";
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
      <p className={styles.period}>{chapter.period}</p>
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
    const update = ({ height }: { height: number }) => {
      if (disposed) return;
      const top = section.getBoundingClientRect().top;
      const width = document.documentElement.clientWidth;
      const rect = source.getBoundingClientRect();
      const sourceOffset = rect.top - top;
      const headerBottom =
        document.querySelector("header")?.getBoundingClientRect().bottom ?? 80;
      const entryStart = Math.max(
        height * 0.65,
        headerBottom + 40 - sourceOffset,
      );
      const progress = motion.matches
        ? 1
        : clamp((entryStart - top) / (entryStart + height * 0.7));
      const eased = smooth(progress);
      // Freeze the starting rectangle in viewport space while scrolling into it.
      const sourceTop = rect.top + entryStart - top;
      const x = mix(rect.left, -1, eased);
      const y = mix(sourceTop, -40, eased);
      const w = mix(rect.width, width + 2, eased);
      const h = mix(rect.height, height + 42, eased);
      browser.style.setProperty("--browser-x", `${x}px`);
      browser.style.setProperty("--browser-y", `${y}px`);
      browser.style.setProperty("--browser-width", `${w}px`);
      browser.style.setProperty("--browser-height", `${h}px`);
      browser.style.setProperty("--browser-radius", `${mix(12, 0, eased)}px`);
      browser.style.setProperty("--preview-width", `${width}px`);
      browser.style.setProperty("--preview-scale", String(w / width));
      browser.style.setProperty(
        "--cursor-opacity",
        String(1 - smooth(progress / 0.28)),
      );
      browser.style.setProperty("--browser-shadow", String((1 - eased) * 0.13));
      browser.style.setProperty(
        "--page-reveal",
        String(smooth((progress - 0.24) / 0.4)),
      );
      browser.style.setProperty(
        "--diagram-opacity",
        String(1 - smooth(progress / 0.34)),
      );
      browser.style.setProperty("--click-scale", String(1 + progress * 16));
      browser.hidden = motion.matches || progress <= 0 || progress >= 1;
      source.style.opacity =
        progress > 0 && progress < 1 && !motion.matches ? "0" : "1";
      section.dataset.entered = String(progress >= 1);
      section.dataset.phase = motion.matches
        ? "static"
        : progress <= 0
          ? "before"
          : progress < 1
            ? "entering"
            : "inside";
      section.dataset.entryProgress = progress.toFixed(4);
      section.dataset.enhanced = String(!motion.matches);
      section.dataset.ready = "true";
      const viewport = getScrollViewport();
      if (viewport)
        viewport.dataset.journeyActive = String(
          top < entryStart && top + section.offsetHeight > headerBottom,
        );
      const dock = content.querySelector<HTMLElement>("[data-journey-skills]");
      const line = section.querySelector<HTMLElement>("[data-journey-line]");
      const threshold = (dock?.getBoundingClientRect().bottom ?? 200) + 100;
      let active = 0;
      cards.forEach((card, index) => {
        const bounds = card.getBoundingClientRect();
        if (bounds.top <= threshold) active = index;
        card.dataset.revealed = String(
          motion.matches || bounds.top < height * 0.94,
        );
      });
      section.dataset.chapter = String(active);
      cards.forEach(
        (card, index) => (card.dataset.active = String(index === active)),
      );
      links.forEach((link, index) => {
        if (index === active) link.setAttribute("aria-current", "step");
        else link.removeAttribute("aria-current");
      });
      if (line) {
        const bounds = line.getBoundingClientRect();
        line.style.setProperty(
          "--line-progress",
          String(
            motion.matches
              ? 1
              : clamp((threshold - bounds.top) / Math.max(1, bounds.height)),
          ),
        );
        const outro = ending.current;
        const drawing = connection.current;
        if (outro && drawing) {
          const area = outro.getBoundingClientRect();
          const origin = bounds.left - area.left;
          const center = area.width * 0.5;
          const junction = Math.min(108, area.height * 0.2);
          const travel = motion.matches
            ? 1
            : clamp((threshold - bounds.bottom) / (area.height * 0.85));
          drawing.style.visibility = travel > 0 ? "visible" : "hidden";
          outro.style.setProperty("--connection-progress", String(travel));
          outro.style.setProperty(
            "--connection-wash",
            String(smooth((travel - 0.25) / 0.75)),
          );
          outro.dataset.progress = travel.toFixed(4);
          const paths = [
            ...drawing.querySelectorAll<SVGPathElement>(
              "[data-connection-path]",
            ),
          ];
          paths.forEach((path, index) => {
            const target = area.width * (0.04 + index * 0.153333);
            const bend = target < center ? -1 : 1;
            const spread = Math.abs(index - 3) / 3;
            const d = `M ${origin} 0 C ${origin} ${junction * 0.55}, ${center} ${junction * 0.35}, ${center} ${junction} C ${center} ${junction + 80}, ${center + bend * (area.width * 0.18 + spread * area.width * 0.12)} ${area.height * 0.42}, ${target} ${area.height + 10}`;
            path.setAttribute("d", d);
            path.style.strokeDashoffset = String(
              1 - smooth(travel * 1.3 - index * 0.035),
            );
          });
        }
      }
    };
    const unsubscribe = subscribeScroll(update);
    const resize = () =>
      update({
        height:
          document.querySelector<HTMLElement>("[data-scroll-viewport]")
            ?.clientHeight ?? innerHeight,
      });
    const observer = new ResizeObserver(resize);
    observer.observe(source);
    motion.addEventListener("change", resize);
    document.fonts.ready.then(() => {
      if (!disposed) resize();
    });
    return () => {
      disposed = true;
      unsubscribe();
      observer.disconnect();
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
