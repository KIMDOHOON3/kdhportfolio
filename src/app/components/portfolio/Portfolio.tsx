"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { portfolioProjects } from "../../data/portfolio";
import GlassScene from "./GlassScene";
import ProjectCover from "./ProjectCover";
import styles from "./Portfolio.module.scss";

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
        FRONTEND DEVELOPER
        <br />
        BASED IN KOREA
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
          Work <sup>05</sup>
        </Link>
        <Link href="/#about" onClick={() => setOpen(false)}>
          About
        </Link>
        <Link href="/#contact" onClick={() => setOpen(false)}>
          Let’s talk <span>↗</span>
        </Link>
      </nav>
    </header>
  );
}

export function PortfolioFooter() {
  return (
    <footer className={styles.footer} id="contact">
      <div className={styles.sectionLabel}>
        <span>03 / CONTACT</span>
        <span>GOOD THINGS START WITH A HELLO.</span>
      </div>
      <div className={styles.contactMain}>
        <h2>
          LET’S MAKE
          <br />
          SOMETHING <i>GOOD.</i>
        </h2>
        <a
          className={styles.contactArrow}
          href="mailto:kingyska@nate.com"
          aria-label="김도훈에게 이메일 보내기"
        >
          ↗
        </a>
      </div>
      <div className={styles.contactLinks}>
        <a href="mailto:kingyska@nate.com">kingyska@nate.com ↗</a>
        <a
          href="https://github.com/KIMDOHOON3"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
        <a href="/resume/김도훈-이력서.pdf" download>
          이력서 다운로드 ↓
        </a>
      </div>
      <div className={styles.footerBottom}>
        <span>© {new Date().getFullYear()} KIM DOHOON</span>
        <span>DESIGNED & DEVELOPED WITH CARE.</span>
        <a href="#top">BACK TO TOP ↑</a>
      </div>
    </footer>
  );
}

export default function Portfolio() {
  const [filter, setFilter] = useState("All");
  const [clock, setClock] = useState("--:--");
  const root = useRef<HTMLElement>(null);
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
    (project) => filter === "All" || project.category === filter,
  );

  return (
    <main ref={root} id="top" className={styles.portfolio}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroGrid} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className={styles.heroTop}>
          <h1 id="hero-title">
            THOUGHTFUL CODE.
            <br />
            TANGIBLE
            <br />
            <span>EXPERIENCES.</span>
          </h1>
          <span className={styles.heroIndex}>
            PORTFOLIO — 2026
            <br />
            DESIGN MEETS DEVELOPMENT
          </span>
        </div>
        <GlassScene />
        <span className={styles.orbitMark} aria-hidden="true">
          ✳
        </span>
        <div className={styles.heroBottom}>
          <p className={styles.heroIntro}>
            안녕하세요, 프론트엔드 개발자 <strong>김도훈</strong>입니다.
            <br />
            섬세한 인터랙션과 견고한 코드로
            <br />
            기억에 남는 웹 경험을 만듭니다.
          </p>
          <a href="#work" className={styles.explore}>
            EXPLORE SELECTED WORK <span>↓</span>
          </a>
        </div>
        <div className={styles.heroStatus}>
          <span>
            <i /> OPEN TO NEW OPPORTUNITIES
          </span>
          <span>
            SEOUL, KR <b>{clock}</b>
          </span>
        </div>
      </section>

      <section id="work" className={styles.work} aria-labelledby="work-title">
        <div className={styles.sectionLabel}>
          <span>01 / SELECTED WORK</span>
          <span>CLIENT WORK & PERSONAL EXPLORATIONS</span>
        </div>
        <div className={styles.workHeading}>
          <h2 id="work-title">
            Made with
            <br />
            <i>purpose.</i>
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
              {["All", "Client work", "Personal project"].map((value) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  aria-pressed={filter === value}
                >
                  {value === "All"
                    ? "All work"
                    : value === "Client work"
                      ? "Client"
                      : "Personal"}
                  <span>
                    {value === "All"
                      ? "05"
                      : value === "Client work"
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
              data-reveal
              key={project.id}
              className={`${styles.project} ${project.id === 1 ? styles.featured : ""}`}
            >
              <Link
                href={`/work/${project.id}`}
                className={styles.projectLink}
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
                    {project.id === 1 && <span>Renewal</span>}
                    {project.id === 2 && <span>Digital experience</span>}
                  </h3>
                  <span aria-hidden="true">↗</span>
                </div>
                <p className={styles.projectSubtitle}>{project.subtitle}</p>
                <div className={styles.stack}>
                  {project.stack.slice(0, 3).map((tech) => (
                    <span key={tech}>{tech}</span>
                  ))}
                </div>
              </Link>
            </article>
          ))}
        </div>
        {filter !== "All" && (
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
        <div className={styles.sectionLabel}>
          <span>02 / A LITTLE ABOUT ME</span>
          <span>CURIOUS MIND. CAREFUL HANDS.</span>
        </div>
        <div className={styles.aboutContent}>
          <div className={styles.aboutLeft}>
            <span className={styles.aboutStar} aria-hidden="true">
              ✳
            </span>
            <h2 id="about-title">
              CRAFT IN
              <br />
              EVERY <i>DETAIL.</i>
            </h2>
            <span className={styles.aboutCoordinates}>
              CODE × INTERACTION × EXPERIENCE
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
              <span>React / Next.js</span>
              <span>TypeScript / JavaScript</span>
              <span>Zustand / Supabase</span>
              <span>GSAP / Three.js</span>
              <span>SCSS / Emotion</span>
              <span>Responsive & Accessible UI</span>
            </div>
            <a
              href="/resume/김도훈-이력서.pdf"
              download
              className={styles.resumeLink}
            >
              조금 더 자세한 이야기는 이력서에 <span>↗</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
