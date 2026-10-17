"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { portfolioProjects } from "../../data/portfolio";
import GlassScene from "./GlassScene";
import ProjectCover from "./ProjectCover";
import usePaperMotion from "./usePaperMotion";
import ArrowIcon from "./ArrowIcon";
import TechnologyIcon from "./TechnologyIcon";
import { MailIcon, GithubIcon, DownloadIcon, SkillIconMap } from "../Icons";
import styles from "./Portfolio.module.scss";

function GridGuides() {
  return (
    <div className={styles.pageGrid} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export function PortfolioHeader() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  return (
    <header className={styles.header}>
      <Link
        className={styles.logo}
        href="/"
        onClick={() => setOpen(false)}
        aria-label="김도훈 포트폴리오 홈"
      >
        DOHOON<span>®</span>
      </Link>
      <span className={styles.headerNote}>
        프론트엔드 개발자
        <br />
        김도훈의 포트폴리오
      </span>
      <button
        className={styles.menuButton}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        aria-controls="main-navigation"
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
      </button>
      <nav
        id="main-navigation"
        className={`${styles.nav} ${open ? styles.navOpen : ""}`}
        aria-label="메인 메뉴"
      >
        <Link href="/#work" onClick={() => setOpen(false)}>
          프로젝트 <sup>05</sup>
        </Link>
        <Link href="/#about" onClick={() => setOpen(false)}>
          소개
        </Link>
        <Link href="/#contact" onClick={() => setOpen(false)}>
          연락하기 <ArrowIcon />
        </Link>
      </nav>
    </header>
  );
}

export function PortfolioFooter() {
  return (
    <footer className={styles.footer} id="contact">
      <GridGuides />
      <div className={styles.sectionLabel}>
        <span>03 / 연락하기</span>
        <span>함께할 다음 이야기를 기다립니다.</span>
      </div>
      <div className={styles.contactMain}>
        <h2>
          함께 만들
          <br />
          다음 <i>경험.</i>
        </h2>
        <a
          className={styles.contactArrow}
          href="mailto:kingyska@nate.com"
          aria-label="김도훈에게 이메일 보내기"
        >
          <MailIcon
            className={styles.actionIcon}
            fill="currentColor"
            aria-hidden="true"
          />
        </a>
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
        <span>기획 · 디자인 · 개발 김도훈</span>
        <a href="#top">맨 위로 ↑</a>
      </div>
    </footer>
  );
}

export default function Portfolio() {
  const [filter, setFilter] = useState("전체");
  const [clock, setClock] = useState("--:--");
  const root = useRef<HTMLElement>(null);
  usePaperMotion(root, filter);
  useEffect(() => {
    const update = () =>
      setClock(
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Seoul",
        }).format(new Date()),
      );
    update();
    const interval = setInterval(update, 60000);
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
      clearInterval(interval);
      observer.disconnect();
    };
  }, [filter]);
  const visibleProjects = portfolioProjects.filter(
    (project) => filter === "전체" || project.category === filter,
  );

  return (
    <main ref={root} id="top" className={styles.portfolio}>
      <div className={styles.heroStage}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <GridGuides />
          <h1 id="hero-title" className={styles.visuallyHidden}>
            김도훈 — 프론트엔드 개발자 포트폴리오
          </h1>
          <GlassScene />
          <div className={styles.heroBottom}>
            <p className={styles.heroIntro}>
              안녕하세요, 프론트엔드 개발자 <strong>김도훈</strong>입니다.
              <br />
              브랜드 웹사이트와 일상 속 서비스를
              <br />
              직접 구현하고 다듬습니다.
            </p>
            <a href="#work" className={styles.explore}>
              프로젝트 살펴보기{" "}
              <span>
                <ArrowIcon down />
              </span>
            </a>
          </div>
          <div className={styles.heroStatus}>
            <span>
              <i /> 함께할 팀을 찾고 있습니다
            </span>
            <span>
              한국 시간 <b>{clock}</b>
            </span>
          </div>
        </section>
      </div>

      <section id="work" className={styles.work} aria-labelledby="work-title">
        <GridGuides />
        <div className={styles.sectionLabel}>
          <span>01 / 프로젝트</span>
          <span>실무에서 쌓은 경험과 직접 만든 서비스</span>
        </div>
        <div className={styles.workHeading}>
          <h2 id="work-title">
            고민을 담아
            <br />
            <i>만든 작업들.</i>
            <sup>(05)</sup>
          </h2>
          <div className={styles.workAside}>
            <p>
              브랜드의 경험부터 일상 속 작은 서비스까지.
              <br />
              직접 고민하고, 구현하고, 다듬은 작업들입니다.
            </p>
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
                    {value === "전체"
                      ? "05"
                      : value === "실무 프로젝트"
                        ? "03"
                        : "02"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.projectGrid}>
          {visibleProjects.map((project) => (
            <article
              data-paper
              key={project.id}
              className={`${styles.project} ${project.id === 1 ? styles.featured : ""}`}
            >
              <Link
                href={`/work/${project.id}`}
                className={styles.projectLink}
                data-paper-surface
                aria-label={`${project.title} ${project.id === 1 ? "리뉴얼" : project.id === 2 ? "운영 및 개선" : ""} 프로젝트 보기`}
              >
                <ProjectCover project={project} />
                <div className={styles.projectMeta}>
                  <span>
                    {String(project.id).padStart(2, "0")} / {project.category}
                  </span>
                  <span>{project.year}</span>
                </div>
                <div className={styles.projectTitle}>
                  <h3>
                    {project.title}
                    {project.id === 1 && <span>리뉴얼</span>}
                    {project.id === 2 && <span>운영 · 개선</span>}
                  </h3>
                  <span aria-hidden="true">
                    <ArrowIcon />
                  </span>
                </div>
                <p className={styles.projectSubtitle}>{project.subtitle}</p>
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

      <section
        id="about"
        className={styles.about}
        aria-labelledby="about-title"
      >
        <GridGuides />
        <div className={styles.sectionLabel}>
          <span>02 / 소개</span>
          <span>궁금한 것은 깊게, 작은 부분은 세심하게.</span>
        </div>
        <div className={styles.aboutContent}>
          <div className={styles.aboutLeft}>
            <span className={styles.aboutStar} aria-hidden="true">
              ✳
            </span>
            <h2 id="about-title">
              작은 차이까지
              <br />
              <i>꼼꼼하게.</i>
            </h2>
            <span className={styles.aboutCoordinates}>
              코드 × 인터랙션 × 사용자 경험
            </span>
          </div>
          <div className={styles.aboutText} data-reveal>
            <p className={styles.aboutLead}>
              좋은 화면을 넘어,
              <br />
              <strong>잘 작동하는 경험을 만듭니다.</strong>
            </p>
            <p>
              퍼블리싱으로 시작해 프론트엔드 개발로 영역을 넓혀왔습니다. 화면의
              작은 움직임부터 데이터와 상태의 흐름까지, 보이는 부분과 보이지
              않는 부분을 함께 고민합니다.
            </p>
            <p>
              렉서스와 기아의 브랜드 경험을 구현했고, 개인 프로젝트에서는
              기획부터 디자인, 개발까지 직접 맡아 서비스를 만들어가고 있습니다.
            </p>
            <div className={styles.skillList}>
              {Object.keys(SkillIconMap).map((skill) => (
                <span key={skill}>
                  <TechnologyIcon name={skill} />
                  {skill}
                </span>
              ))}
            </div>
            <a
              href="/resume/김도훈-이력서.pdf"
              download
              className={styles.resumeLink}
            >
              조금 더 자세한 이야기는 이력서에{" "}
              <span>
                <DownloadIcon
                  className={styles.actionIcon}
                  fill="currentColor"
                  aria-hidden="true"
                />
              </span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
