"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icons";
import { JOURNEY_SKILLS } from "@/app/data/journey";
import styles from "./Journey.module.scss";

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
    const observer = new IntersectionObserver(([entry]) => {
      element.dataset.visible = String(entry.isIntersecting);
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
          Skill<span>계속 배우고, 직접 사용합니다.</span>
        </h3>
        {!decorative && (
          <button
            type="button"
            className={styles.pause}
            aria-label={paused ? "스킬 롤링 재생" : "스킬 롤링 일시 정지"}
            aria-pressed={paused}
            onClick={() => setPaused(!paused)}
          >
            <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
          </button>
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
                      name={skill}
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
