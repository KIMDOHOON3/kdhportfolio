"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { subscribeScroll } from "./ScrollViewport";
import TechnologyIcon from "./TechnologyIcon";
import { DownloadIcon, SkillIconMap } from "../Icons";
import styles from "./Portfolio.module.scss";

function StaggerLine({ text, line }: { text: string; line: number }) {
  return (
    <span className={styles.storyLine}>
      {Array.from(text).map((char, index, chars) => (
        <span
          className={styles.storyChar}
          key={index}
          style={
            {
              "--char-delay": `${line * 100 + (index / Math.max(1, chars.length - 1)) * 203 + ((index * 37) % 83)}ms`,
            } as CSSProperties
          }
        >
          {char === " " ? "\u00a0" : char}
        </span>
      ))}
    </span>
  );
}

export default function ScrollStory() {
  const root = useRef<HTMLElement>(null);
  const orbit = useRef<SVGSVGElement>(null);
  const [stage, setStage] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    change();
    setEnhanced(true);
    media.addEventListener("change", change);
    const unsubscribe = subscribeScroll(({ height }) => {
      const section = root.current;
      if (!section) return;
      const top = section.getBoundingClientRect().top;
      const travel = Math.max(0, -top / height);
      const next = Math.min(3, Math.floor(travel / 2));
      setStage(next);
      setReveal(
        top <= height * 0.2 && top + section.offsetHeight > height * 0.35,
      );
      section.style.setProperty(
        "--story-progress",
        String(Math.min(1, travel / 8)),
      );
      const distance = Math.min(1, Math.max(0, (travel - 4) / 2)) * 945;
      const used: number[] = [];
      orbit.current?.querySelectorAll("ellipse").forEach((ring, index) => {
        const y =
          distance <= 300
            ? distance - (Math.min(6, Math.floor(distance / 50)) - index) * 50
            : distance <= 600
              ? (distance - 300 + index * 50) % 300
              : distance - 600 + index * 50;
        const visible =
          y > 0 &&
          y < 300 &&
          (distance > 300 || distance >= index * 50) &&
          !used.some((value) => Math.abs(value - y) < 0.5);
        ring.style.visibility = visible ? "visible" : "hidden";
        if (!visible) return;
        used.push(y);
        const radius = Math.sqrt(Math.max(0, 22500 - (y - 150) ** 2));
        ring.setAttribute("cy", String(22 + y));
        ring.setAttribute("rx", String(radius));
        ring.setAttribute("ry", String(radius * 0.1));
      });
    });
    return () => {
      unsubscribe();
      media.removeEventListener("change", change);
    };
  }, []);
  const hide = (index: number) => enhanced && !reduced && stage !== index;
  return (
    <section
      ref={root}
      className={styles.scrollStory}
      data-scroll-story
      data-stage={stage}
      data-enhanced={enhanced && !reduced}
      data-story-reveal={reveal}
      aria-label="코드와 사용자 경험에 대한 생각"
    >
      <div className={styles.storyPinned} data-story-pinned>
        <div
          className={styles.storyPanel}
          data-story-panel="0"
          hidden={hide(0)}
        >
          <h2>
            <StaggerLine text="작은 차이까지" line={0} />
            <StaggerLine text="꼼꼼하게." line={1} />
          </h2>
          <span className={styles.storyCaption}>
            궁금한 것은 깊게, 작은 부분은 세심하게.
          </span>
        </div>
        <div
          className={styles.storyPanel}
          data-story-panel="1"
          hidden={hide(1)}
        >
          <h2>
            <StaggerLine text="좋은 화면을 넘어," line={0} />
            <StaggerLine text="잘 작동하는" line={1} />
            <StaggerLine text="경험을 만듭니다." line={2} />
          </h2>
        </div>
        <div
          className={`${styles.storyPanel} ${styles.storySkills}`}
          data-story-panel="2"
          hidden={hide(2)}
        >
          <svg
            ref={orbit}
            className={styles.storyOrbit}
            viewBox="0 0 344 344"
            data-story-orbit
            aria-hidden="true"
          >
            {Array.from({ length: 7 }, (_, i) => (
              <ellipse
                key={i}
                cx="172"
                cy="172"
                rx="0"
                ry="0"
                visibility="hidden"
              />
            ))}
          </svg>
          {[
            ["화면의 작은 움직임부터", Object.keys(SkillIconMap).slice(0, 4)],
            ["데이터와 상태의 흐름까지", Object.keys(SkillIconMap).slice(4, 7)],
            [
              "보이는 부분과 보이지 않는 부분",
              Object.keys(SkillIconMap).slice(7, 10),
            ],
            ["함께 고민합니다.", Object.keys(SkillIconMap).slice(10)],
          ].map(([label, skills], index) => (
            <div
              className={styles.storyPrinciple}
              data-principle={index}
              key={index}
            >
              <p>{label as string}</p>
              <div>
                {(skills as string[]).map((skill) => (
                  <span key={skill}>
                    <TechnologyIcon name={skill} />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <a
            href="/resume/김도훈-이력서.pdf"
            download
            className={styles.resumeLink}
          >
            조금 더 자세한 이야기는 이력서에{" "}
            <DownloadIcon
              className={styles.actionIcon}
              fill="currentColor"
              aria-hidden="true"
            />
          </a>
        </div>
        <div
          className={styles.storyPanel}
          data-story-panel="3"
          hidden={hide(3)}
        >
          <h2>
            <StaggerLine text="함께 만들" line={0} />
            <StaggerLine text="다음 경험." line={1} />
          </h2>
          <span className={styles.storyCaption}>
            함께할 다음 이야기를 기다립니다.
          </span>
        </div>
      </div>
    </section>
  );
}
