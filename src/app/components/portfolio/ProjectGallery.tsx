"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import type { PortfolioProject } from "../../data/portfolio";
import { portfolioProjects } from "../../data/portfolio";
import Image from "next/image";
import GalleryCanvas from "./GalleryCanvas";
import GalleryPointer from "./GalleryPointer";
import GalleryLineText from "./GalleryLineText";
import useGalleryCopyMotion from "./useGalleryCopyMotion";
import useGalleryEntrance from "./useGalleryEntrance";
import { getSelectedProject, selectGalleryProject } from "./gallerySelection";
import TechnologyIcon from "./TechnologyIcon";
import ArrowIcon from "./ArrowIcon";
import { ButtonLabel, ButtonLight } from "./ButtonEffect";
import { buttonMotion } from "./buttonMotion";
import styles from "./ProjectGallery.module.scss";

// Keep the selected work when returning from its detail route, without writing
// browser storage or changing the main page's URL/anchor behavior.
let lastAutoplay = true;
const count = (value: number) => String(value).padStart(2, "0");

function ProjectInformation({
  project,
  active,
  reveal,
}: {
  project: PortfolioProject;
  active: boolean;
  reveal: boolean;
}) {
  const information = useGalleryCopyMotion(active && reveal);
  return (
    <article
      ref={information}
      className={styles.information}
      aria-labelledby={active ? "gallery-project-title" : undefined}
      aria-hidden={!active || !reveal || undefined}
      inert={!active || !reveal}
      data-information-active={active && reveal}
      data-selected-project={active ? project.id : undefined}
    >
      <div className={styles.identity}>
        <p className={styles.meta}>
          <span>
            <GalleryLineText
              text={`${count(portfolioProjects.indexOf(project) + 1)} ${project.category}`}
            />
          </span>
          <span>
            <GalleryLineText text={project.year} />
          </span>
        </p>
        <h3 id={active ? "gallery-project-title" : undefined}>
          <GalleryLineText text={project.title} />
        </h3>
        <p
          id={active ? "gallery-project-description" : undefined}
          className={styles.description}
        >
          <GalleryLineText text={project.subtitle} />
        </p>
        <div className={styles.stack}>
          <div className={styles.stackMotion} data-gallery-reveal>
            {project.stack.slice(0, 3).map((tech) => (
              <span key={tech} className={styles.stackEntry}>
                <TechnologyIcon name={tech} />
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.details}>
        <p className={styles.label}>
          <GalleryLineText
            text={
              project.category === "개인 프로젝트" ? "주요 구현" : "담당 업무"
            }
          />
        </p>
        <ul>
          {project.responsibilities?.map((task) => (
            <li key={task}>
              <GalleryLineText text={task} />
            </li>
          ))}
        </ul>
        <div className={styles.actionMask}>
          <div className={styles.actionMotion} data-gallery-reveal>
            <Link
              href={`/work/${project.id}`}
              scroll={false}
              className={styles.detailLink}
              aria-label={`${project.title} 상세 내용 보기`}
              {...buttonMotion}
            >
              <ButtonLight />
              <ButtonLabel>상세 내용 보기</ButtonLabel>
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ProjectGallery({
  projects,
}: {
  projects: PortfolioProject[];
}) {
  const [selected, setSelected] = useState(getSelectedProject);
  const stage = useRef<HTMLDivElement>(null);
  const entrance = useGalleryEntrance(stage);
  const [autoplay, setAutoplay] = useState(lastAutoplay);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    horizontal: boolean;
  } | null>(null);
  const releaseTimer = useRef(0);
  const index = Math.max(
    0,
    projects.findIndex((project) => project.id === selected),
  );
  const project = projects[index];

  const select = (next: number) => {
    const id = projects[(next + projects.length) % projects.length].id;
    selectGalleryProject(id);
    setSelected(id);
  };
  useEffect(() => () => window.clearTimeout(releaseTimer.current), []);

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    window.clearTimeout(releaseTimer.current);
    delete event.currentTarget.dataset.dragging;
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      horizontal: false,
    };
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.horizontal) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        gesture.current = null;
        return;
      }
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
      start.horizontal = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset.dragging = "true";
    }
    event.currentTarget
      .querySelector("[data-gallery-canvas]")
      ?.dispatchEvent(new CustomEvent("gallery:drag", { detail: dx }));
  };
  const up = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.id !== event.pointerId) return;
    event.currentTarget
      .querySelector("[data-gallery-canvas]")
      ?.dispatchEvent(
        new CustomEvent("gallery:release", { detail: cancelled }),
      );
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (!start.horizontal) return;
    // The release click belongs to the drag, never to the destination link.
    releaseTimer.current = window.setTimeout(() => {
      if (stage.current) delete stage.current.dataset.dragging;
    }, 250);
  };

  return (
    <div
      ref={entrance.root}
      className={styles.gallery}
      data-project-gallery
      data-gallery-entrance={entrance.phase}
      onPointerDownCapture={(event) => {
        if (
          entrance.phase !== "done" &&
          event.target instanceof Element &&
          event.target.closest("a, button")
        )
          entrance.finish();
      }}
      onFocusCapture={(event) => {
        if (
          event.target instanceof HTMLElement &&
          event.target.matches(":focus-visible")
        ) {
          entrance.finish();
          lastAutoplay = false;
          setAutoplay(false);
        }
      }}
    >
      <div
        ref={stage}
        data-entrance-area="프로젝트 필름"
        className={styles.stage}
        role="region"
        aria-roledescription="carousel"
        aria-label="프로젝트 갤러리"
        aria-describedby="gallery-instructions"
        tabIndex={0}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={(event) => up(event)}
        onPointerCancel={(event) => up(event, true)}
        onClick={(event) => {
          if (
            event.target instanceof Element &&
            event.target.closest("a, button")
          )
            return;
          if (event.currentTarget.dataset.dragging === "true") return;
          event.currentTarget
            .querySelector("[data-gallery-canvas]")
            ?.dispatchEvent(
              new CustomEvent("gallery:pick", {
                detail: { x: event.clientX, y: event.clientY },
              }),
            );
        }}
        onDragStart={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            select(index + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}
      >
        <div className={styles.fallbackArtwork} aria-hidden="true">
          <Image
            src={`/projects/gallery/${project.id}.webp`}
            alt=""
            fill
            sizes="80vw"
          />
        </div>
        <GalleryCanvas
          ids={projects.map((item) => item.id)}
          selected={project.id}
          autoplay={autoplay && entrance.phase === "done"}
          onSelect={(id) => {
            selectGalleryProject(id);
            setSelected(id);
          }}
        />
        {projects.map((item) => (
          <div
            key={item.id}
            data-gallery-panel={item.id}
            data-active={item.id === project.id}
            className={styles.panel}
            aria-hidden={item.id !== project.id || undefined}
          >
            {item.id === project.id && (
              <Link
                href={`/work/${item.id}`}
                scroll={false}
                className={styles.stageLink}
                data-gallery-open
                aria-label={`${item.title} 프로젝트 보기`}
                aria-describedby="gallery-project-description"
              >
                <span aria-hidden="true">
                  <ArrowIcon />
                </span>
              </Link>
            )}
          </div>
        ))}
        <GalleryPointer stage={stage} />
      </div>

      <div className={styles.controls}>
        <p id="gallery-instructions" className={styles.instructions}>
          좌우로 넘겨보세요
        </p>
        <div className={styles.pager}>
          <button
            type="button"
            onClick={() => select(index - 1)}
            aria-label="이전 프로젝트"
            {...buttonMotion}
          >
            <ButtonLight />
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5m7-7-7 7 7 7" />
            </svg>
          </button>
          <p aria-live={autoplay ? "off" : "polite"} aria-atomic="true">
            <span className={styles.currentCount} aria-hidden="true">
              {projects.map((item, i) => (
                <span key={item.id} data-count-active={i === index}>
                  {count(i + 1)}
                </span>
              ))}
            </span>
            <span className={styles.slash} aria-hidden="true">
              /
            </span>
            <span aria-hidden="true">{count(projects.length)}</span>
            <span className={styles.srOnly}>
              {count(index + 1)} / {count(projects.length)} {project.title}
            </span>
          </p>
          <button
            type="button"
            onClick={() => select(index + 1)}
            aria-label="다음 프로젝트"
            {...buttonMotion}
          >
            <ButtonLight />
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14m-7-7 7 7-7 7" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.pause}
            aria-label="갤러리 자동 회전 일시 정지"
            aria-pressed={!autoplay}
            title={autoplay ? "자동 회전 일시 정지" : "자동 회전 재생"}
            onClick={() => {
              lastAutoplay = !autoplay;
              setAutoplay(!autoplay);
            }}
            {...buttonMotion}
          >
            <ButtonLight />
            <span aria-hidden="true" data-pause-active={autoplay}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              >
                <path d="M9 6v12m6-12v12" />
              </svg>
            </span>
            <span aria-hidden="true" data-pause-active={!autoplay}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              >
                <path d="m9 6 9 6-9 6Z" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      <div className={styles.informationFrame}>
        {projects.map((item) => (
          <ProjectInformation
            key={item.id}
            project={item}
            active={item.id === project.id}
            reveal={entrance.phase === "copy" || entrance.phase === "done"}
          />
        ))}
      </div>

      <nav className={styles.projectNav} aria-label="프로젝트 바로 선택">
        {projects.map((item, i) => (
          <button
            type="button"
            key={item.id}
            onClick={() => select(i)}
            aria-pressed={i === index}
            {...buttonMotion}
          >
            <ButtonLight />
            <span className={styles.navNumber}>{count(i + 1)}</span>
            <span className={styles.navLabel}>
              <ButtonLabel wrap>{item.title}</ButtonLabel>
            </span>
            <span className={styles.navMark} aria-hidden="true">
              <ArrowIcon />
            </span>
          </button>
        ))}
      </nav>
      <noscript>
        <nav className={styles.fallbackNav} aria-label="프로젝트 상세 목록">
          {projects.map((item) => (
            <a key={item.id} href={`/work/${item.id}`}>
              {item.title} ↗
            </a>
          ))}
        </nav>
      </noscript>
    </div>
  );
}
