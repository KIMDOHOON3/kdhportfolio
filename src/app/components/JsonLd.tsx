import { portfolioProjects } from "../data/portfolio";

export default function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "김도훈",
    jobTitle: "프론트엔드 개발자",
    url: "https://kdhportfolio.vercel.app/",
    sameAs: ["https://github.com/KIMDOHOON3"],
    description:
      "섬세한 인터랙션과 견고한 코드로 기억에 남는 웹 경험을 만듭니다.",
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
      url: `https://kdhportfolio.vercel.app/work/${project.id}`,
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
