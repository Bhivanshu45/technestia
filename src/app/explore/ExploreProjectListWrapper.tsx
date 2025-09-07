"use client";
import React, { useState, useMemo } from "react";
import useSWR from "swr";
import ProjectList from "@/components/project/ProjectList";
import { fetcher } from "@/lib/fetcher";

interface Project {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  techStack?: string[];
  status?: string;
  tags?: string[];
  creator?: { name: string; username: string; image?: string };
}

const ExploreProjectListWrapper = ({ searchTerm }: { searchTerm: string }) => {
  // Always send the search term to the backend for server-side search
  const url =
    searchTerm && searchTerm.trim().length > 0
      ? `/api/search/projects?query=${encodeURIComponent(searchTerm)}`
      : "/api/search/projects";
  const { data, error, isLoading } = useSWR<any>(url, fetcher);

  const rawProjects = data?.data || [];
  // Map title to name for ProjectList compatibility
  const projects: Project[] = rawProjects.map((p: any) => ({
    ...p,
    name: p.name || p.title || "Untitled",
  }));

  if (isLoading)
    return (
      <div className="text-center py-10 text-zinc-500">Loading projects...</div>
    );
  if (error)
    return (
      <div className="text-center py-10 text-red-500">
        Failed to load projects.
      </div>
    );

  // Handler to navigate to public project details page
  const handleProjectClick = (id: string) => {
    window.location.href = `/project/${id}`;
  };

  return (
    <ProjectList projects={projects} onProjectClick={handleProjectClick} />
  );
};

export default ExploreProjectListWrapper;
