import { portfolioProjects } from "../data/portfolio";

export default function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "김도훈",
    jobTitle: "프론트엔드 개발자",
    url: "https://kdhportfolio-omega.vercel.app/",
    sameAs: ["https://github.com/KIMDOHOON3"],
    description:
      "디자인피버에서 프론트엔드 개발자로 재직 중입니다. 렉서스 상담·예약 UI와 기아 반응형 UI·스크롤 인터랙션을 개발했습니다.",
    knowsAbout: [
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "Zustand",
      "GSAP",
      "Three.js",
    ],
    subjectOf: portfolioProjects.map((project) => ({
      "@type": "CreativeWork",
      name: `${project.title} — ${project.subtitle}`,
      description: project.description,
      url: `https://kdhportfolio-omega.vercel.app/work/${project.id}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
