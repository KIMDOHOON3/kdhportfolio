"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { useRef, useState } from "react";
import { portfolioProjects } from "@/data/portfolio";
import ProjectGallery from "@/components/projects/gallery/ProjectGallery";
import ActionArrow from "@/components/ui/ActionArrow";
import AboutSection from "./AboutSection";
import ScrollStory from "@/components/journey/ScrollStory";
import styles from "@/styles/Portfolio.module.scss";
import { ButtonLabel } from "@/components/ui/ButtonEffect";
import { GLASS_ASSETS } from "@/data/glassAssets";
import CopyReveal from "@/components/ui/CopyReveal";
import useElementEntrances from "@/lib/motion/useElementEntrances";
import {
  filterGalleryProjects,
  getProjectFilter,
} from "@/components/projects/gallery/gallerySelection";

const projectCount = (count: number) => String(count).padStart(2, "0");

export default function Portfolio() {
  const [filter, setFilter] = useState(getProjectFilter);
  const root = useRef<HTMLElement>(null);
  useElementEntrances(root, filter);
  const visibleProjects = portfolioProjects.filter(
    (project) => filter === "전체" || project.category === filter,
  );

  return (
    <main ref={root} id="top" className={styles.portfolio}>
      <link
        rel="preload"
        href={GLASS_ASSETS.hello}
        as="fetch"
        crossOrigin="anonymous"
      />
      <section
        id="home"
        className={styles.hero}
        aria-labelledby="hero-title"
        data-hero
      >
        <h1 id="hero-title" className={styles.visuallyHidden}>
          김도훈 포트폴리오
        </h1>
        <div
          className={styles.heroLetteringFrame}
          data-hero-lettering-frame
          aria-hidden="true"
        />
        <div className={styles.heroBottom}>
          <div className={styles.heroSummary} data-intro-summary>
            <p className={styles.heroLead}>
              보이는 장면과
              <br />
              보이지 않는 흐름을 만듭니다.
            </p>
            <p className={styles.heroIntro}>프론트엔드 개발자 김도훈입니다.</p>
          </div>
          <ButtonLink
            href="#work"
            className={`${styles.explore} ${styles.exploreLoop}`}
            aria-label="프로젝트 살펴보기"
            data-intro-cta
          >
            <ButtonLabel>프로젝트 살펴보기</ButtonLabel>
            <ActionArrow down />
          </ButtonLink>
        </div>
      </section>
      <section
        id="work"
        className={styles.work}
        aria-labelledby="work-title"
        data-intro-below
      >
        <div
          className={styles.workHeading}
          data-entrance-area="프로젝트 제목·필터"
        >
          <h2 id="work-title">
            <CopyReveal>프로젝트</CopyReveal>
          </h2>
          <div
            className={styles.filters}
            role="group"
            aria-label="프로젝트 필터"
          >
            {["전체", "실무 프로젝트", "개인 프로젝트"].map((value) => {
              const label =
                value === "전체"
                  ? "전체"
                  : value === "실무 프로젝트"
                    ? "실무"
                    : "개인";
              const count = projectCount(
                portfolioProjects.filter(
                  (project) => value === "전체" || project.category === value,
                ).length,
              );
              return (
                <Button
                  key={value}
                  onClick={() => {
                    filterGalleryProjects(value);
                    setFilter(value);
                  }}
                  aria-pressed={filter === value}
                  aria-label={`${label} ${count}`}
                  data-element-reveal="button"
                >
                  <span data-filter-label>
                    <ButtonLabel>{label}</ButtonLabel>
                  </span>
                  <span data-filter-count aria-hidden="true">
                    {count}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
        <ProjectGallery key={filter} projects={visibleProjects} />
        {filter !== "실무 프로젝트" && (
          <aside className={styles.personalNote}>
            <h3>개인 프로젝트와 개발 방식</h3>
            <p>
              Aeppy와 Dog Atlas는 기획·디자인·개발을 맡은 개인 프로젝트입니다.
              AI를 개발 과정에 활용하며, 회사 업무와 별도로 만들고 있습니다.
            </p>
          </aside>
        )}
        {filter !== "전체" && (
          <p
            className={styles.filterResult}
            aria-live="polite"
            data-entrance-area="프로젝트 필터 결과"
          >
            <CopyReveal>{`${visibleProjects.length}개의 프로젝트를 보고 있습니다.`}</CopyReveal>
          </p>
        )}
      </section>

      <AboutSection />
      <ScrollStory />
    </main>
  );
}
