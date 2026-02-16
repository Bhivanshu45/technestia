"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import ProjectCard from "../project/ProjectCard";
import { Project } from "@/types/project";

interface ProjectsListViewProps {
  projects: Project[];
  statusFilter: string;
  visibilityFilter: string;
  sortBy: string;
  searchQuery: string;
}

const ProjectsListView: React.FC<ProjectsListViewProps> = ({
  projects,
  statusFilter,
  visibilityFilter,
  sortBy,
  searchQuery,
}) => {
  const router = useRouter();

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Filter by visibility
    if (visibilityFilter === "public") {
      filtered = filtered.filter((p) => p.isPublic);
    } else if (visibilityFilter === "private") {
      filtered = filtered.filter((p) => !p.isPublic);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          p.techStack.some((tech) => tech.toLowerCase().includes(query))
      );
    }

    // Sort
    if (sortBy === "recent") {
      filtered.sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    } else if (sortBy === "oldest") {
      filtered.sort(
        (a, b) =>
          new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
      );
    } else if (sortBy === "title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "title-desc") {
      filtered.sort((a, b) => b.title.localeCompare(a.title));
    }

    return filtered;
  }, [projects, statusFilter, visibilityFilter, sortBy, searchQuery]);

  const handleProjectClick = (id: number) => {
    router.push(`/projects/${id}`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {filteredAndSortedProjects.map((project) => (
        <ProjectCard
          key={project.id}
          id={String(project.id)}
          name={project.title}
          description={project.description}
          coverImage={project.screenshots[0] || undefined}
          techStack={project.techStack}
          status={project.status}
          onClick={() => handleProjectClick(project.id)}
        />
      ))}
    </div>
  );
};

export default ProjectsListView;
