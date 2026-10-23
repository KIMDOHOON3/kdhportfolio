import { portfolioProjects } from "../../data/portfolio";

// Shared by the gallery and route coordinator; never loads a renderer or model.
let selectedProject = 1;
let projectFilter = "전체";

export const getSelectedProject = () => selectedProject;
export const getProjectFilter = () => projectFilter;
export function selectGalleryProject(id: number) {
  selectedProject = id;
}
export function filterGalleryProjects(filter: string) {
  projectFilter = filter;
}

/** Remember committed detail routes, including direct visits and browser history. */
export function rememberProjectRoute(pathname: string) {
  const match = /^\/work\/(\d+)\/?$/.exec(pathname);
  if (!match) return;
  const project = portfolioProjects.find(
    (project) => project.id === Number(match[1]),
  );
  if (!project) return;
  selectedProject = project.id;
  if (projectFilter !== "전체" && projectFilter !== project.category)
    projectFilter = "전체";
}
