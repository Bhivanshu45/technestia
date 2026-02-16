"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { useCollaboratedProjects } from "@/hooks/useProjects";
import ProjectFilterBar from "@/components/projects/ProjectFilterBar";
import ProjectsListView from "@/components/projects/ProjectsListView";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";

export default function CollaboratedProjectsPage() {
  const router = useRouter();
  const { projects, isLoading, isError, mutate } = useCollaboratedProjects();
  
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <h1 className="text-2xl md:text-2xl font-bold text-white mb-1">
            Collaborated Projects
          </h1>
          <p className="text-[#A1A1AA] text-sm">
            Projects you're collaborating on
          </p>
        </div>
        <LoadingSkeleton type="card" count={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load collaborated projects"
          message="We couldn't fetch your collaborated projects. Please try again."
          onRetry={() => mutate()}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl md:text-2xl font-bold text-white mb-1">
          Collaborated Projects
        </h1>
        <p className="text-[#A1A1AA] text-sm">
          {projects.length} {projects.length === 1 ? "project" : "projects"} you're collaborating on
        </p>
      </div>

      {/* Filters */}
      {projects.length > 0 && (
        <div className="mt-3">
          <ProjectFilterBar
            onStatusChange={setStatusFilter}
            onVisibilityChange={setVisibilityFilter}
            onSortChange={setSortBy}
            onSearchChange={setSearchQuery}
          />
        </div>
      )}

      {/* Projects List */}
      {projects.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No collaborated projects yet"
          description="You haven't been added as a collaborator to any projects yet."
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
