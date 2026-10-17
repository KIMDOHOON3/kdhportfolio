"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { subscribeScroll } from "./ScrollViewport";
import TechnologyIcon from "./TechnologyIcon";
import { DownloadIcon } from "../Icons";
import { STORY_SCREENS, STORY_STAGE_SPAN } from "./storyMotion";
import { EXPERIENCES } from "@/app/data/experience";
import styles from "./Portfolio.module.scss";

const skillGroups = [
  {
    label: "화면 구현",
    skills: ["HTML", "CSS", "JavaScript"],
    description:
      "반응형 레이아웃과 스크롤 인터랙션을 구현하고, 브라우저별 차이를 다듬습니다.",
  },
  {
    label: "앱 개발",
    skills: ["React", "Next.js", "TypeScript"],
    description:
      "공통 UI를 컴포넌트로 만들고, 타입을 바탕으로 화면과 기능을 연결합니다.",
  },
  {
    label: "상태와 데이터",
    skills: ["Zustand", "React-query", "Redux"],
    description:
      "예약·폼의 상태를 관리하고, API 데이터와 로딩·오류 흐름을 처리합니다.",
  },
];

const experienceSummaries = [1, 0, 3, 2].map((index) => EXPERIENCES[index]);
const profileTabs = ["기술 활용", "이력 요약"];

function ExperienceOverview() {
  const [selected, setSelected] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  return (
    <>
      <div
        className={styles.storyProfileTabs}
        role="tablist"
        aria-label="기술과 이력"
      >
        {profileTabs.map((label, index) => (
          <button
            key={label}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            id={`profile-tab-${index}`}
            role="tab"
            type="button"
            aria-selected={selected === index}
            aria-controls={`profile-panel-${index}`}
            tabIndex={selected === index ? 0 : -1}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => {
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? profileTabs.length - 1
                    : event.key === "ArrowRight"
                      ? (selected + 1) % profileTabs.length
                      : event.key === "ArrowLeft"
                        ? (selected + profileTabs.length - 1) %
                          profileTabs.length
                        : null;
              if (next === null) return;
              event.preventDefault();
              setSelected(next);
              tabs.current[next]?.focus();
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.storyProfileContent}>
        <div
          className={styles.storySkillGroups}
          id="profile-panel-0"
          role="tabpanel"
          aria-labelledby="profile-tab-0"
          tabIndex={0}
          hidden={selected !== 0}
        >
          {skillGroups.map(({ label, skills, description }, index) => (
            <article
              className={styles.storyPrinciple}
              data-principle={index}
              key={label}
            >
              <h3>{label}</h3>
              <div>
                {skills.map((skill) => (
                  <span key={skill}>
                    <TechnologyIcon name={skill} />
                    {skill === "React-query" ? "React Query" : skill}
                  </span>
                ))}
              </div>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <div
          className={styles.storyExperienceList}
          id="profile-panel-1"
          role="tabpanel"
          aria-labelledby="profile-tab-1"
          tabIndex={0}
          hidden={selected !== 1}
        >
          {experienceSummaries.map((experience) => (
            <article
              className={styles.storyExperience}
              key={experience.company}
            >
              <div>
                <h3>
                  {experience.company === "영어학과"
                    ? "한경대학교"
                    : experience.company === "SBS아카데미컴퓨터아트학원"
                      ? "SBS아카데미"
                      : experience.company}
                </h3>
                <span>
                  {experience.period.replace(/[()]/g, "").replace(" ~ ", " — ")}
                </span>
              </div>
              <p>{experience.shortTitle}</p>
              <p>{experience.summary}</p>
            </article>
          ))}
        </div>
      </div>
      <a
        href="/resume/김도훈-이력서.pdf"
        download
        className={styles.resumeLink}
      >
        이력서 내려받기{" "}
        <DownloadIcon
          className={styles.actionIcon}
          fill="currentColor"
          aria-hidden="true"
        />
      </a>
    </>
  );
}

function StaggerLine({ text, line }: { text: string; line: number }) {
  return (
    <span className={styles.storyLine} aria-hidden="true">
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
      const next = Math.min(3, Math.floor(travel / STORY_STAGE_SPAN));
      setStage(next);
      setReveal(
        top <= height * 0.2 && top + section.offsetHeight > height * 0.35,
      );
      section.style.setProperty(
        "--story-progress",
        String(Math.min(1, travel / STORY_SCREENS)),
      );
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
      style={{ "--story-screens": STORY_SCREENS } as CSSProperties}
      aria-label="코드와 사용자 경험에 대한 생각"
    >
      <div className={styles.storyPinned} data-story-pinned>
        <div
          className={styles.storyPanel}
          data-story-panel="0"
          hidden={hide(0)}
        >
          <h2 aria-label="디테일까지 꼼꼼하게.">
            <StaggerLine text="디테일까지" line={0} />
            <StaggerLine text="꼼꼼하게." line={1} />
          </h2>
          <span className={styles.storyCaption}>
            작은 움직임도 사용자의 흐름에 맞춥니다.
          </span>
        </div>
        <div
          className={styles.storyPanel}
          data-story-panel="1"
          hidden={hide(1)}
        >
          <h2 aria-label="보기 좋고, 쓰기도 편하게.">
            <StaggerLine text="보기 좋고," line={0} />
            <StaggerLine text="쓰기도 편하게." line={1} />
          </h2>
          <span className={styles.storyCaption}>
            화면부터 기능까지 자연스럽게 연결합니다.
          </span>
        </div>
        <div
          className={`${styles.storyPanel} ${styles.storySkills}`}
          data-story-panel="2"
          hidden={hide(2)}
        >
          <h2 aria-label="기술, 그리고 경험.">
            <StaggerLine text="기술, 그리고 경험." line={0} />
          </h2>
          <ExperienceOverview />
        </div>
        <div
          className={styles.storyPanel}
          data-story-panel="3"
          hidden={hide(3)}
        >
          <h2 aria-label="함께 만들 다음 경험.">
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
