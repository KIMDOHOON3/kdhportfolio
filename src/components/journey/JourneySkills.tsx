"use client";

import { Button } from "@/components/ui/Button";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icons";
import { JOURNEY_SKILLS } from "@/data/journey";
import styles from "./Journey.module.scss";
import { ButtonLight } from "@/components/ui/ButtonEffect";

let skillsClock: number | undefined;
const skillIconNames: Record<string, string> = {
  "styled-components": "Styled-components",
  "Tailwind CSS": "Tailwind",
  "React Query": "React-query",
};

export function syncJourneySkillsClock(root: Element) {
  const element = root.matches("[data-journey-skills]")
    ? root
    : root.querySelector<HTMLElement>("[data-journey-skills]");
  if (!element || (element as HTMLElement).dataset.paused === "true") return;
  skillsClock ??= Number(document.timeline.currentTime ?? 0);
  const animation = element
    .querySelector("[data-skills-track]")
    ?.getAnimations()[0];
  if (animation)
    animation.currentTime =
      Number(document.timeline.currentTime ?? 0) - skillsClock;
}

export default function JourneySkills({
  decorative = false,
}: {
  decorative?: boolean;
}) {
  const [paused, setPaused] = useState(false);
  const dock = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = dock.current;
    if (!element) return;
    skillsClock ??= Number(document.timeline.currentTime ?? 0);
    const observer = new IntersectionObserver(([entry]) => {
      element.dataset.visible = String(entry.isIntersecting);
      // Both portal and real content resume against the same clock. Each can
      // sleep offscreen without the rolling icons jumping at the handoff.
      if (entry.isIntersecting) syncJourneySkillsClock(element);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={dock}
      className={styles.skillsDock}
      data-journey-skills
      data-paused={paused}
      data-visible="false"
    >
      <div className={styles.skillsHeading}>
        <h3>
          Skill
          <span className={styles.skillsCaption}>
            계속 배우고, 직접 사용합니다.
          </span>
        </h3>
        {decorative ? (
          <span
            className={styles.pause}
            data-preview-pause
            data-button-effect
            aria-hidden="true"
          >
            <ButtonLight />Ⅱ
          </span>
        ) : (
          <Button
            type="button"
            className={styles.pause}
            aria-label={paused ? "스킬 롤링 재생" : "스킬 롤링 일시 정지"}
            aria-pressed={paused}
            onClick={() => setPaused(!paused)}
          >
            <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
          </Button>
        )}
      </div>
      <div className={styles.skillsWindow}>
        <div className={styles.skillsTrack} data-skills-track>
          {[0, 1].map((copy) => (
            <ul
              className={styles.skillGroup}
              key={copy}
              aria-hidden={copy === 1 || decorative ? true : undefined}
            >
              {JOURNEY_SKILLS.map((skill) => (
                <li key={skill}>
                  <span className={styles.skillCircle}>
                    <Icon
                      name={skillIconNames[skill] ?? skill}
                      color="currentColor"
                      size={28}
                      aria-hidden="true"
                    />
                  </span>
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
