import { ButtonLink } from "@/components/ui/Button";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { portfolioProjects } from "@/data/portfolio";
import { GALLERY_ASSETS } from "@/data/staticAssets";
import Image from "next/image";
import TechnologyList from "@/components/ui/TechnologyList";
import ArrowIcon from "@/components/ui/ArrowIcon";
import DetailAction from "@/components/projects/detail/DetailAction";
import DetailCopy from "@/components/projects/detail/DetailCopy";
import { ButtonLabel, ButtonLight } from "@/components/ui/ButtonEffect";
import styles from "@/components/projects/detail/ProjectDetail.module.scss";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = portfolioProjects.find(
    (project) => project.id === Number(id),
  );
  if (!project) return { title: "프로젝트를 찾을 수 없습니다" };
  return {
    title: `${project.title} — ${project.subtitle} | 김도훈`,
    description: project.description,
    openGraph: {
      title: `${project.title} | 김도훈 포트폴리오`,
      description: project.description,
      type: "article",
      ...(project.image
        ? { images: [{ url: project.image, alt: project.title }] }
        : {}),
    },
  };
}

export default async function ProjectDetail({ params }: Props) {
  const { id } = await params;
  const index = portfolioProjects.findIndex(
    (project) => project.id === Number(id),
  );
  if (index < 0) notFound();
  const project = portfolioProjects[index];
  const next = portfolioProjects[(index + 1) % portfolioProjects.length];
  const sections = project.phases ?? [
    {
      id: "implementation",
      title: project.implementationTitle ?? "주요 구현 내용",
      year: project.year,
      role: project.role,
      stack: project.stack,
      highlights: project.highlights,
    },
  ];
  const responsibilities =
    project.responsibilities ?? project.highlights.map((item) => item.title);
  return (
    <main id="top" className={styles.detail} data-project-detail={project.id}>
      <div className={styles.topline}>
        <ButtonLink
          navigation="client"
          href="/#work"
          scroll={false}
          className={styles.backLink}
        >
          <ButtonLabel>← 프로젝트 목록으로</ButtonLabel>
        </ButtonLink>
        <span className={styles.projectIndex}>
          PROJECT {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <header className={styles.heroTitle}>
        <p className={styles.category}>
          {project.category} <span>{project.year}</span>
        </p>
        <h1
          id="project-title"
          className={project.title.length > 9 ? styles.longTitle : undefined}
        >
          {project.title}
        </h1>
      </header>
      <div
        className={styles.heroVisual}
        data-project-visual
        data-project-transition-cover
      >
        <Image
          src={GALLERY_ASSETS[project.id]}
          alt={`${project.title} 프로젝트 대표 이미지`}
          width={1200}
          height={800}
          priority
          sizes="100vw"
          unoptimized
        />
      </div>
      <section
        id="overview"
        className={styles.overview}
        aria-labelledby="project-title"
        data-project-overview
      >
        <header className={styles.identity}>
          <p className={styles.subtitle}>{project.subtitle}</p>
          <div className={styles.actions}>
            {project.site && (
              <DetailAction href={project.site} label="사이트 바로가기" />
            )}
            {project.github && (
              <DetailAction
                href={project.github}
                label="GitHub 코드 보기"
                secondary
              />
            )}
          </div>
        </header>
        <div className={styles.brief}>
          <p className={styles.eyebrow}>PROJECT OVERVIEW</p>
          <p className={styles.description}>
            <DetailCopy
              text={project.description}
              emphasis={project.emphasis}
            />
          </p>
          <div className={styles.responsibilities}>
            <h2>
              {project.category === "실무 프로젝트"
                ? "담당 업무"
                : "구현한 기능"}
            </h2>
            <ul>
              {responsibilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <dl className={styles.facts}>
          <div>
            <dt>담당 역할</dt>
            <dd>{project.role}</dd>
          </div>
          <div>
            <dt>작업 기간</dt>
            <dd className={project.periods ? styles.periods : undefined}>
              {project.periods
                ? project.periods.map((period) => (
                    <span key={period.label}>
                      {period.label} {period.value}
                    </span>
                  ))
                : project.year}
            </dd>
          </div>
          <div>
            <dt>작업 유형</dt>
            <dd>
              {project.category === "실무 프로젝트"
                ? "실무 프로젝트 · 팀 작업"
                : "개인 프로젝트"}
            </dd>
          </div>
        </dl>
      </section>
      <div className={styles.reading}>
        <nav
          className={styles.contents}
          aria-label={project.id === 1 ? "렉서스 작업 구분" : "프로젝트 목차"}
          data-detail-contents
        >
          <span>IN THIS PROJECT</span>
          <div>
            {sections.map((phase, sectionIndex) => (
              <ButtonLink href={`#${phase.id}`} key={phase.id}>
                <span>{String(sectionIndex + 1).padStart(2, "0")}</span>{" "}
                <ButtonLabel>{phase.title}</ButtonLabel> <ArrowIcon down />
              </ButtonLink>
            ))}
          </div>
        </nav>
        {sections.map((phase, sectionIndex) => (
          <section
            id={phase.id}
            className={styles.workSection}
            aria-labelledby={`${phase.id}-title`}
            key={phase.id}
            data-detail-section
          >
            <header className={styles.phaseHeading}>
              <span className={styles.phaseNumber}>
                {String(sectionIndex + 1).padStart(2, "0")}
              </span>
              <p className={styles.phaseYear}>{phase.year}</p>
              <h2 id={`${phase.id}-title`}>{phase.title}</h2>
              {project.phases && (
                <p className={styles.phaseRole}>{phase.role}</p>
              )}
              <TechnologyList
                technologies={phase.stack}
                className={styles.stack}
              />
            </header>
            <div className={styles.implementations}>
              {phase.highlights.map((item, i) => (
                <article key={item.title}>
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>
                      <DetailCopy
                        text={item.description}
                        emphasis={item.emphasis}
                      />
                    </p>
                    {item.steps && (
                      <dl className={styles.caseSteps}>
                        {item.steps.map((step) => (
                          <div key={step.label}>
                            <dt>{step.label}</dt>
                            <dd>
                              <DetailCopy
                                text={step.description}
                                emphasis={step.emphasis}
                              />
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <Link
        className={styles.nextProject}
        href={`/work/${next.id}`}
        scroll={false}
        aria-label={`다음 프로젝트 ${next.title}`}
        data-button-effect
      >
        <span>
          <small>
            <ButtonLabel>다음 프로젝트</ButtonLabel>
          </small>
          <strong>
            <ButtonLabel>{next.title}</ButtonLabel>
          </strong>
          <span className={styles.nextSubtitle}>
            <ButtonLabel wrap>{next.subtitle}</ButtonLabel>
          </span>
        </span>
        <span aria-hidden="true">
          <ButtonLight />
          <ArrowIcon />
        </span>
      </Link>
    </main>
  );
}

export function generateStaticParams() {
  return portfolioProjects.map((project) => ({ id: String(project.id) }));
}
