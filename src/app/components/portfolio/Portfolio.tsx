"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Navigation from "../Header/Navigation";
import NavTrigger from "../Header/NavTrigger";
import { portfolioProjects } from "../../data/portfolio";
import GlassScene from "./GlassScene";
import ProjectCover from "./ProjectCover";
import ArrowIcon from "./ArrowIcon";
import TechnologyIcon from "./TechnologyIcon";
import AboutSection from "./AboutSection";
import ScrollStory from "./ScrollStory";
import BackgroundScreen from "./BackgroundScreen";
import { MailIcon, GithubIcon, DownloadIcon } from "../Icons";
import styles from "./Portfolio.module.scss";
import { buttonMotion } from "./buttonMotion";
import { ButtonLabel, ButtonLight } from "./ButtonEffect";
import { GLASS_ASSETS } from "../../data/glassAssets";
import ProjectCoverEntrance from "./ProjectCoverEntrance";
import CopyReveal from "./CopyReveal";
import useElementEntrances from "./useElementEntrances";

const projectCount = (count: number) => String(count).padStart(2, "0");

export function PortfolioBackdrop() {
  return (
    <>
      <GlassScene />
      <BackgroundScreen />
    </>
  );
}

export function PortfolioHeader() {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        header.current
          ?.querySelector<HTMLButtonElement>("#navTrigger")
          ?.focus({ preventScroll: true });
      }
    };
    const keyboardTrigger = header.current?.querySelector(
      "#navTrigger:focus-visible",
    );
    if (open && keyboardTrigger)
      header.current
        ?.querySelector<HTMLAnchorElement>("nav a")
        ?.focus({ preventScroll: true });
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);
  useEffect(() => {
    const mobile = matchMedia("(max-width: 768px)");
    const closeOnDesktop = () => {
      if (!mobile.matches) setOpen(false);
    };
    mobile.addEventListener("change", closeOnDesktop);
    return () => mobile.removeEventListener("change", closeOnDesktop);
  }, []);
  return (
    <header ref={header} className={styles.header}>
      <Link
        className={styles.logo}
        href="/#top"
        scroll={false}
        onClick={() => setOpen(false)}
        aria-label="김도훈 포트폴리오 홈"
        data-intro-logo
      >
        DOHOON<span>®</span>
      </Link>
      <div className={styles.headerMenu}>
        <NavTrigger isActive={open} onClick={() => setOpen(!open)} />
        <Navigation isActive={open} onNavItemClick={() => setOpen(false)} />
      </div>
    </header>
  );
}

export function PortfolioFooter() {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (root.current && !root.current.dataset.footerEntrance)
      root.current.dataset.footerEntrance = matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
        ? "done"
        : "waiting";
  }, []);
  useElementEntrances(root);
  return (
    <footer ref={root} className={styles.footer} id="contact" data-intro-below>
      <div className={styles.contactMain}>
        <h2 className={styles.thankYou} lang="en" data-footer-thanks>
          <span>THANK</span> <span>YOU</span>
        </h2>
      </div>
      <div className={styles.contactLinks} data-entrance-area="푸터 연락처">
        <a
          href="mailto:kingyska@nate.com"
          data-element-reveal="button"
          data-button-effect
        >
          <ButtonLight />
          <MailIcon
            className={styles.actionIcon}
            fill="currentColor"
            aria-hidden="true"
          />
          <ButtonLabel>kingyska@nate.com</ButtonLabel>
        </a>
        <a
          href="https://github.com/KIMDOHOON3"
          target="_blank"
          rel="noreferrer"
          data-element-reveal="button"
          data-button-effect
        >
          <ButtonLight />
          <GithubIcon
            className={styles.actionIcon}
            fill="currentColor"
            aria-hidden="true"
          />
          <ButtonLabel>GitHub</ButtonLabel>
        </a>
        <a
          href="/resume/김도훈-이력서.pdf"
          download
          data-element-reveal="button"
          data-button-effect
        >
          <ButtonLight />
          <DownloadIcon
            className={styles.actionIcon}
            fill="currentColor"
            aria-hidden="true"
          />
          <ButtonLabel>이력서 다운로드</ButtonLabel>
        </a>
      </div>
      <div className={styles.footerBottom} data-entrance-area="푸터 하단">
        <span>
          <CopyReveal
            inline
          >{`© ${new Date().getFullYear()} 김도훈`}</CopyReveal>
        </span>
        <a href="#top" data-element-reveal="button" data-button-effect>
          <ButtonLight />
          <ButtonLabel>맨 위로 ↑</ButtonLabel>
        </a>
      </div>
    </footer>
  );
}

export default function Portfolio() {
  const [filter, setFilter] = useState("전체");
  const root = useRef<HTMLElement>(null);
  useElementEntrances(root, filter);
  const revealed = useRef(new Set<number>());
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
              상담·예약 UI와 브랜드 인터랙션을 개발하는
              <br />
              프론트엔드 개발자 김도훈입니다.
            </p>
            <p className={styles.heroIntro}>
              렉서스 상담·예약 컴포넌트 · 기아 반응형 UI·스크롤 인터랙션
            </p>
          </div>
          <a
            href="#work"
            className={`${styles.explore} ${styles.exploreLoop}`}
            aria-label="프로젝트 살펴보기"
            data-intro-cta
            {...buttonMotion}
          >
            <ButtonLight />
            <ButtonLabel>프로젝트 살펴보기</ButtonLabel>
            <span className={styles.exploreIcon} aria-hidden="true">
              <ArrowIcon down />
              <ArrowIcon down />
            </span>
          </a>
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
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  aria-pressed={filter === value}
                  aria-label={`${label} ${count}`}
                  data-element-reveal="button"
                  {...buttonMotion}
                >
                  <ButtonLight />
                  <span data-filter-label>
                    <ButtonLabel>{label}</ButtonLabel>
                  </span>
                  <span data-filter-count aria-hidden="true">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className={styles.projectGrid}>
          {visibleProjects.map((project) => (
            <article
              data-paper
              key={project.id}
              className={styles.project}
              data-entrance-area={project.title}
            >
              <Link
                href={`/work/${project.id}`}
                scroll={false}
                className={styles.projectLink}
                data-paper-surface
                data-button-effect
                aria-label={`${project.title} 프로젝트 보기`}
                aria-describedby={
                  project.responsibilities
                    ? `project-tasks-${project.id}`
                    : undefined
                }
              >
                <div className={styles.projectMeta}>
                  <span>
                    <CopyReveal
                      inline
                      seen={revealed.current.has(project.id)}
                    >{`${projectCount(portfolioProjects.indexOf(project) + 1)} ${project.category}`}</CopyReveal>
                  </span>
                  <span>
                    <CopyReveal inline seen={revealed.current.has(project.id)}>
                      {project.year}
                    </CopyReveal>
                  </span>
                </div>
                <div className={styles.projectTitle}>
                  <h3>
                    <CopyReveal seen={revealed.current.has(project.id)}>
                      {project.title}
                    </CopyReveal>
                  </h3>
                </div>
                {project.responsibilities ? (
                  <div className={styles.projectTasks}>
                    <p>
                      <CopyReveal seen={revealed.current.has(project.id)}>
                        담당 업무
                      </CopyReveal>
                    </p>
                    <ul id={`project-tasks-${project.id}`}>
                      {project.responsibilities.map((task) => (
                        <li key={task}>
                          <CopyReveal seen={revealed.current.has(project.id)}>
                            {task}
                          </CopyReveal>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className={styles.projectSubtitle}>
                    <CopyReveal seen={revealed.current.has(project.id)}>
                      {project.subtitle}
                    </CopyReveal>
                  </p>
                )}
                <ProjectCoverEntrance
                  projectId={project.id}
                  seen={revealed.current.has(project.id)}
                  onStart={() => {
                    revealed.current.add(project.id);
                  }}
                >
                  <ProjectCover project={project} />
                </ProjectCoverEntrance>
                <div className={styles.stack} data-entrance-after-cover>
                  {project.stack.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      data-element-reveal="item"
                      data-element-seen={
                        revealed.current.has(project.id) ? "true" : undefined
                      }
                    >
                      <TechnologyIcon name={tech} />
                      {tech}
                    </span>
                  ))}
                </div>
              </Link>
            </article>
          ))}
        </div>
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
