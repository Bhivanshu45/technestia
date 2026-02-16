"use client";

import React from "react";
import { Archive } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";

export default function ArchivedProjectPage() {
  // TODO: Implement archived projects API and hook
  const projects: any[] = [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl md:text-2xl font-bold text-white mb-1">
          Archived Projects
        </h1>
        <p className="text-[#A1A1AA] text-sm">
          View and restore your archived projects
        </p>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="No archived projects"
          description="You haven't archived any projects yet."
        />
      ) : (
        <div>
          {/* TODO: Implement archived projects list */}
        </div>
      )}
    </div>
  );
}
