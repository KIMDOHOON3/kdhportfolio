import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { portfolioProjects } from "../../data/portfolio";
import ProjectCover from "../../components/portfolio/ProjectCover";
import styles from "../../components/portfolio/Portfolio.module.scss";

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
  return (
    <main id="top" className={styles.detail}>
      <Link href="/#work" className={styles.backLink}>
        ← BACK TO SELECTED WORK
      </Link>
      <div className={styles.sectionLabel}>
        <span>
          {String(project.id).padStart(2, "0")} / {project.category}
        </span>
        <span>{project.year}</span>
      </div>
      <div className={styles.detailHeading}>
        <div>
          <h1>{project.title}</h1>
          <p>{project.subtitle}</p>
        </div>
        <div className={styles.stack}>
          {project.stack.map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
      </div>
      <div className={styles.detailVisual}>
        <ProjectCover project={project} priority />
      </div>
      <div className={styles.detailInfo}>
        <dl>
          <dt>ROLE</dt>
          <dd>{project.role}</dd>
          <dt>YEAR</dt>
          <dd>{project.year}</dd>
          <dt>STACK</dt>
          <dd>{project.stack.join(" / ")}</dd>
          <dt>TYPE</dt>
          <dd>
            {project.category === "Client work"
              ? "실무 프로젝트 · 팀 작업"
              : "개인 프로젝트"}
          </dd>
        </dl>
        <div>
          <p className={styles.detailDescription}>{project.description}</p>
          <div className={styles.detailLinks}>
            {project.site && (
              <a href={project.site} target="_blank" rel="noreferrer">
                VISIT WEBSITE ↗
              </a>
            )}
            {project.github && (
              <a href={project.github} target="_blank" rel="noreferrer">
                VIEW SOURCE ↗
              </a>
            )}
            {!project.site && !project.github && (
              <span>개인 프로젝트 · 비공개 저장소</span>
            )}
          </div>
        </div>
      </div>
      <section className={styles.detailHighlights}>
        <h2>WHAT I WORKED ON / 주요 구현 내용</h2>
        {project.highlights.map((item, i) => (
          <article key={item.title}>
            <span>0{i + 1}</span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </section>
      <Link className={styles.nextProject} href={`/work/${next.id}`}>
        <span>
          <small>NEXT PROJECT</small>
          {next.title}
        </span>
        <span aria-hidden="true">↗</span>
      </Link>
    </main>
  );
}

export function generateStaticParams() {
  return portfolioProjects.map((project) => ({ id: String(project.id) }));
}
