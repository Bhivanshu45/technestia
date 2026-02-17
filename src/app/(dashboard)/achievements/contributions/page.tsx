"use client";

import React, { useMemo } from "react";
import { useProjects, useCollaboratedProjects } from "@/hooks/useProjects";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

export default function ContributionsPage() {
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

  const { activityLogs, isLoading } = useActivityFeed(allProjects);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    activityLogs.forEach((log: any) => {
      const type = log.actionType || log.activityType || "UNKNOWN";
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [activityLogs]);

  if (loadingOwned || loadingCollab || isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={TrendingUp}
          title="No contributions yet"
          description="Your activity will appear here once you start collaborating."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Contribution Stats</h1>
        <p className="text-[#A1A1AA] text-sm">
          A readable summary of where you contribute most
        </p>
      </div>

      <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
        <p className="text-xs text-[#A1A1AA]">Total contribution events</p>
        <p className="text-2xl font-bold text-white mt-1">{activityLogs.length}</p>
        <p className="text-xs text-[#A1A1AA] mt-1">
          Across {allProjects.length} active project{allProjects.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {stats.map(([type, count]) => (
          <div
            key={type}
            className="bg-[#232326] border border-zinc-800 rounded-lg p-5 flex items-center justify-between"
          >
            <div>
              <p className="text-sm text-white font-semibold">
                {type.replace(/_/g, " ").toLowerCase()}
              </p>
              <p className="text-xs text-[#A1A1AA]">Frequency across projects</p>
            </div>
            <Badge className="bg-blue-900 text-blue-200">{count}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
