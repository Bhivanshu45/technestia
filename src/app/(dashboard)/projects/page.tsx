"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/useProjects";
import ProjectFilterBar from "@/components/projects/ProjectFilterBar";
import ProjectsListView from "@/components/projects/ProjectsListView";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, isLoading, isError, mutate } = useProjects();
  
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreateProject = () => {
    router.push("/projects/create");
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl md:text-2xl font-bold text-white mb-1">
              My Projects
            </h1>
            <p className="text-[#A1A1AA] text-sm">
              Manage and view all your projects
            </p>
          </div>
        </div>
        <LoadingSkeleton type="card" count={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load projects"
          message="We couldn't fetch your projects. Please try again."
          onRetry={() => mutate()}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <h1 className="text-2xl md:text-2xl font-bold text-white mb-1">
            My Projects
          </h1>
          <p className="text-[#A1A1AA] text-sm">
            {projects.length} {projects.length === 1 ? "project" : "projects"} total
          </p>
        </div>
        <Button onClick={handleCreateProject} className="gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2">
          <Plus className="h-4 w-4" />
          Create Project
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-3">
        <ProjectFilterBar
          onStatusChange={setStatusFilter}
          onVisibilityChange={setVisibilityFilter}
          onSortChange={setSortBy}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No projects yet"
          description="Start building your portfolio by creating your first project."
          actionLabel="Create Project"
          onAction={handleCreateProject}
        />
      ) : (
        <ProjectsListView
          projects={projects}
          statusFilter={statusFilter}
          visibilityFilter={visibilityFilter}
          sortBy={sortBy}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
}
