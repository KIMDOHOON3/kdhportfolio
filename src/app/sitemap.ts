import { MetadataRoute } from "next";
import { portfolioProjects as projects } from "./data/portfolio";

export default function sitemap(): MetadataRoute.Sitemap {
  // 기본 URL
  const baseUrl = "https://kdhportfolio.vercel.app";

  // 정적 경로
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    // work/[id] 페이지가 있다면 여기에 추가할 수 있습니다
    // 예: work/1, work/2 등의 동적 경로를 추가
  ];

  // 프로젝트 상세 페이지 경로
  const projectRoutes = projects.map((project) => ({
    url: `${baseUrl}/work/${project.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...projectRoutes];
}
