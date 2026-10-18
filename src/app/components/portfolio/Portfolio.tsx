"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
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

const projectCount = (count: number) => String(count).padStart(2, "0");

const positionExploreFill = (event: PointerEvent<HTMLAnchorElement>) => {
  if (event.pointerType !== "mouse" ||
      !matchMedia("(hover: hover) and (pointer: fine)").matches ||
      matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--explore-x", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--explore-y", `${event.clientY - rect.top}px`);
};
const clearExplorePress = (event: PointerEvent<HTMLAnchorElement>) => {
  delete event.currentTarget.dataset.pressed;
};

export function PortfolioHeader() {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        header.current?.querySelector<HTMLButtonElement>("#navTrigger")
          ?.focus({ preventScroll: true });
      }
    };
    const keyboardTrigger = header.current?.querySelector("#navTrigger:focus-visible");
    if (open && keyboardTrigger)
      header.current?.querySelector<HTMLAnchorElement>("nav a")
        ?.focus({ preventScroll: true });
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);
  useEffect(() => {
    const mobile = matchMedia("(max-width: 768px)");
    const closeOnDesktop = () => { if (!mobile.matches) setOpen(false); };
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
  return (
    <footer className={styles.footer} id="contact">
      <div className={styles.contactMain}>
        <h2 className={styles.thankYou} lang="en" data-footer-thanks>
          <span>THANK</span> <span>YOU</span>
        </h2>
      </div>
      <div className={styles.contactLinks}>
        <a href="mailto:kingyska@nate.com">
          <MailIcon
            className={styles.actionIcon}
            fill="currentColor"
            aria-hidden="true"
          />
          kingyska@nate.com
        </a>
        <a
          href="https://github.com/KIMDOHOON3"
          target="_blank"
          rel="noreferrer"
        >
          <GithubIcon
            className={styles.actionIcon}
            fill="currentColor"
            aria-hidden="true"
          />
          GitHub
        </a>
        <a href="/resume/김도훈-이력서.pdf" download>
          <DownloadIcon
            className={styles.actionIcon}
            fill="currentColor"
            aria-hidden="true"
          />
          이력서 다운로드
        </a>
      </div>
      <div className={styles.footerBottom}>
        <span>© {new Date().getFullYear()} 김도훈</span>
        <a href="#top">맨 위로 ↑</a>
      </div>
    </footer>
  );
}

export default function Portfolio() {
  const [filter, setFilter] = useState("전체");
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.isVisible);
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    root.current
      ?.querySelectorAll("[data-reveal]")
      .forEach((element) => observer.observe(element));
    root.current?.classList.add(styles.motionReady);
    return () => {
      observer.disconnect();
    };
  }, [filter]);
  const visibleProjects = portfolioProjects.filter(
    (project) => filter === "전체" || project.category === filter,
  );

  return (
    <main ref={root} id="top" className={styles.portfolio}>
      <GlassScene />
      <BackgroundScreen />
      <section
        id="home"
        className={styles.hero}
        aria-labelledby="hero-title"
        data-hero
      >
        <h1 id="hero-title" className={styles.visuallyHidden}>김도훈 포트폴리오</h1>
        <div
          className={styles.heroLetteringFrame}
          data-hero-lettering-frame
          aria-hidden="true"
        />
        <div className={styles.heroBottom}>
          <div className={styles.heroSummary}>
            <p className={styles.heroCoordinates}>퍼블리싱에서 프론트엔드로</p>
            <p className={styles.heroLead}>
              화면과 기능을 함께 만드는
              <br />
              프론트엔드 개발자 김도훈입니다.
            </p>
            <p className={styles.heroIntro}>
              렉서스·기아 웹 프로젝트 참여
            </p>
          </div>
          <a
            href="#work"
            className={styles.explore}
            aria-label="프로젝트 살펴보기"
            onPointerEnter={positionExploreFill}
            onPointerMove={positionExploreFill}
            onPointerDown={(event) => {
              if (event.pointerType === "touch") event.currentTarget.dataset.pressed = "true";
            }}
            onPointerUp={clearExplorePress}
            onPointerCancel={clearExplorePress}
            onPointerLeave={clearExplorePress}
          >
            <span className={styles.exploreLabel} aria-hidden="true">
              <span>프로젝트 살펴보기</span>
              <span>프로젝트 살펴보기</span>
            </span>
            <span className={styles.exploreIcon} aria-hidden="true">
              <ArrowIcon down />
              <ArrowIcon down />
            </span>
          </a>
        </div>
      </section>
      <section id="work" className={styles.work} aria-labelledby="work-title">
        <div className={styles.workHeading}>
          <h2 id="work-title">프로젝트</h2>
          <div
            className={styles.filters}
            role="group"
            aria-label="프로젝트 필터"
          >
            {["전체", "실무 프로젝트", "개인 프로젝트"].map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
              >
                {value === "전체"
                  ? "전체"
                  : value === "실무 프로젝트"
                    ? "실무"
                    : "개인"}
                <span>
                  {projectCount(
                    portfolioProjects.filter(
                      (project) =>
                        value === "전체" || project.category === value,
                    ).length,
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.projectGrid}>
          {visibleProjects.map((project) => (
            <article
              data-paper
              key={project.id}
              className={styles.project}
            >
              <Link
                href={`/work/${project.id}`}
                scroll={false}
                className={styles.projectLink}
                data-paper-surface
                aria-label={`${project.title} 프로젝트 보기`}
                aria-describedby={project.responsibilities ? `project-tasks-${project.id}` : undefined}
              >
                <div className={styles.projectMeta}>
                  <span>
                    {projectCount(portfolioProjects.indexOf(project) + 1)}{" "}
                    {project.category}
                  </span>
                  <span>{project.year}</span>
                </div>
                <div className={styles.projectTitle}>
                  <h3>{project.title}</h3>
                  <span aria-hidden="true">
                    <ArrowIcon />
                  </span>
                </div>
                {project.responsibilities ? (
                  <div className={styles.projectTasks}>
                    <p>담당 업무</p>
                    <ul id={`project-tasks-${project.id}`}>
                      {project.responsibilities.map((task) => <li key={task}>{task}</li>)}
                    </ul>
                  </div>
                ) : (
                  <p className={styles.projectSubtitle}>{project.subtitle}</p>
                )}
                <ProjectCover project={project} />
                <div className={styles.stack}>
                  {project.stack.slice(0, 3).map((tech) => (
                    <span key={tech}>
                      <TechnologyIcon name={tech} />
                      {tech}
                    </span>
                  ))}
                </div>
              </Link>
            </article>
          ))}
        </div>
        {filter !== "전체" && (
          <p className={styles.filterResult} aria-live="polite">
            {visibleProjects.length}개의 프로젝트를 보고 있습니다.
          </p>
        )}
      </section>

      <AboutSection />
      <ScrollStory />
    </main>
  );
}
