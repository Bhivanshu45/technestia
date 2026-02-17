"use client";

import React, { useMemo } from "react";
import { useProjects, useCollaboratedProjects } from "@/hooks/useProjects";
import { useMilestoneStats } from "@/hooks/useMilestoneStats";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ProgressBar from "@/components/achievements/ProgressBar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function MilestonesAchievementPage() {
  const { projects, isLoading: loadingOwned } = useProjects();
  const { projects: collaboratedProjects, isLoading: loadingCollab } =
    useCollaboratedProjects();

  const allProjects = useMemo(() => {
    const map = new Map<number, { id: number; title: string }>();
    projects.forEach((p: any) => map.set(p.id, { id: p.id, title: p.title }));
    collaboratedProjects.forEach((p: any) =>
      map.set(p.id, { id: p.id, title: p.title })
    );
    return Array.from(map.values());
  }, [projects, collaboratedProjects]);

  const { stats, isLoading } = useMilestoneStats(allProjects);

  if (loadingOwned || loadingCollab || isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  if (stats.byProject.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={CheckCircle}
          title="No milestones yet"
          description="Create milestones on your projects to see progress here."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Milestones Completed</h1>
        <p className="text-[#A1A1AA] text-sm">
          Track completion progress and stay aligned on delivery goals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stats.byProject.map((project) => (
          <div
            key={project.projectId}
            className="bg-[#232326] border border-zinc-800 rounded-lg p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {project.projectTitle}
                </h2>
                <p className="text-xs text-[#A1A1AA]">
                  {project.completed} of {project.total} milestones completed
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-900 text-blue-200">
                  {project.total === 0
                    ? "No milestones"
                    : `${Math.round((project.completed / project.total) * 100)}%`}
                </Badge>
                <Link
                  href={`/projects/${project.projectId}`}
                  className="text-xs text-blue-400 hover:underline"
                >
                  Open
                </Link>
              </div>
            </div>

            <ProgressBar value={project.completed} max={project.total} />

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#18181b] border border-zinc-800 rounded-lg p-3">
                <p className="text-xs text-[#A1A1AA]">In Progress</p>
                <p className="text-lg text-white font-semibold">{project.inProgress}</p>
              </div>
              <div className="bg-[#18181b] border border-zinc-800 rounded-lg p-3">
                <p className="text-xs text-[#A1A1AA]">Not Started</p>
                <p className="text-lg text-white font-semibold">{project.notStarted}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
