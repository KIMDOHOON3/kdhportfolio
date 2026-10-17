"use client";

import Image from "next/image";
import type { PortfolioProject } from "../../data/portfolio";
import styles from "./Portfolio.module.scss";
import ArrowIcon from "./ArrowIcon";
import WorkCoverMockup from "./WorkCoverMockup";

export default function ProjectCover({
  project,
  priority = false,
}: {
  project: PortfolioProject;
  priority?: boolean;
}) {
  return (
    <div
      data-paper-cover
      className={`${styles.cover} ${styles[project.visual]}`}
    >
      <div className={styles.coverSurface} data-cover-surface>
        {project.visual === "lexus" || project.visual === "kia" ? (
          <WorkCoverMockup kind={project.visual} priority={priority} />
        ) : project.visual === "couple" ? (
          <Image
            src={project.image!}
            alt="Aeppy — 추억과 일상을 함께 기록하는 우리만의 공간"
            fill
            sizes="(max-width: 760px) 100vw, 60vw"
            className={styles.aeppyCover}
            priority={priority}
          />
        ) : project.image ? (
          <Image
            src={project.image}
            alt={`${project.title} 프로젝트 이미지`}
            fill
            sizes="(max-width: 760px) 100vw, 60vw"
            priority={priority}
            className={styles.coverImage}
          />
        ) : project.visual === "dog" ? (
          <>
            <span className={styles.dogLabel}>DOG ATLAS 견종도감</span>
            <div className={styles.dogDeck}>
              {["jindo", "golden", "poodle"].map((dog, i) => (
                <div className={styles.dogCard} key={dog}>
                  <Image
                    src={`/projects/dog-${dog}.webp`}
                    alt={
                      [
                        "진돗개 수채화",
                        "골든 리트리버 수채화",
                        "토이푸들 수채화",
                      ][i]
                    }
                    fill
                    sizes="(max-width: 760px) 30vw, 20vw"
                  />
                  <span>{["진돗개", "골든 리트리버", "토이푸들"][i]}</span>
                </div>
              ))}
            </div>
            <span className={styles.dogFoot}>
              나와 잘 맞는 강아지를 알아가는 시간
            </span>
          </>
        ) : null}
      </div>
      <span className={styles.coverArrow} aria-hidden="true">
        <ArrowIcon />
      </span>
    </div>
  );
}
