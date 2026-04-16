"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useProjects, useCollaboratedProjects } from "@/hooks/useProjects";
import { useMilestoneStats } from "@/hooks/useMilestoneStats";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useTopUsers } from "@/hooks/useTopUsers";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle, Sparkles, Trophy } from "lucide-react";

export default function AwardsPage() {
  const { projects, isLoading: loadingOwned } = useProjects();
  const { projects: collaboratedProjects, isLoading: loadingCollab } = useCollaboratedProjects();
  const { users, isLoading: loadingUsers } = useTopUsers();

  const allProjects = useMemo(() => {
    const map = new Map<number, { id: number; title: string }>();
    projects.forEach((project: any) => map.set(project.id, { id: project.id, title: project.title }));
    collaboratedProjects.forEach((project: any) =>
      map.set(project.id, { id: project.id, title: project.title })
    );
    return Array.from(map.values());
  }, [projects, collaboratedProjects]);

  const { stats, isLoading: loadingMilestones } = useMilestoneStats(allProjects);
  const { activityLogs, isLoading: loadingActivity } = useActivityFeed(allProjects);

  if (loadingOwned || loadingCollab || loadingUsers || loadingMilestones || loadingActivity) {
    return (
      <div className="p-6">
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  const completedRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const topUser = users[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Project Awards</h1>
          <p className="text-[#A1A1AA] text-sm">
            A compact view of milestones, recognition, and contribution momentum.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-zinc-700 bg-[#232326] text-white hover:bg-zinc-800">
            <Link href="/achievements/milestones">Milestones</Link>
          </Button>
          <Button asChild>
            <Link href="/achievements/top-collaborator">Leaderboard</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-[#A1A1AA]">Milestones completed</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.completed}</p>
          <p className="text-xs text-[#A1A1AA] mt-1">{completedRate}% completion rate</p>
        </div>
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-[#A1A1AA]">Contribution events</p>
          <p className="text-2xl font-bold text-white mt-1">{activityLogs.length}</p>
          <p className="text-xs text-[#A1A1AA] mt-1">Across {allProjects.length} projects</p>
        </div>
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-[#A1A1AA]">Top collaborator</p>
          <p className="text-2xl font-bold text-white mt-1">{topUser?.name || "No data"}</p>
          <p className="text-xs text-[#A1A1AA] mt-1">
            {topUser ? `@${topUser.username}` : "Start collaborating to rank up"}
          </p>
        </div>
      </div>

      {topUser ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-[#232326] border border-zinc-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Award highlights</h2>
                <p className="text-xs text-[#A1A1AA]">The strongest signals from your workspace</p>
              </div>
              <Badge className="bg-yellow-900 text-yellow-200">Live data</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-zinc-800 bg-[#18181b] p-4">
                <CheckCircle className="h-5 w-5 text-green-400 mb-2" />
                <p className="text-sm text-white font-semibold">Milestones</p>
                <p className="text-xs text-[#A1A1AA]">Completed work that is ready to showcase.</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-[#18181b] p-4">
                <Sparkles className="h-5 w-5 text-blue-400 mb-2" />
                <p className="text-sm text-white font-semibold">Contribution streak</p>
                <p className="text-xs text-[#A1A1AA]">Recent activity keeps your profile active.</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-[#18181b] p-4">
                <Award className="h-5 w-5 text-yellow-400 mb-2" />
                <p className="text-sm text-white font-semibold">Recognition</p>
                <p className="text-xs text-[#A1A1AA]">Your top ranking collaborators surface here.</p>
              </div>
            </div>
          </div>

          <div className="bg-[#232326] border border-zinc-800 rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <h2 className="text-lg font-semibold text-white">Top collaborator</h2>
            </div>
            <div className="flex items-center gap-3">
              <img
                src={topUser.image || "/default-avatar.png"}
                alt={topUser.name}
                className="h-12 w-12 rounded-full border border-zinc-700 object-cover"
              />
              <div>
                <p className="text-white font-semibold">{topUser.name}</p>
                <p className="text-xs text-[#A1A1AA]">@{topUser.username}</p>
                <p className="text-xs text-[#A1A1AA]">{topUser.achievementPoints} points</p>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full border-zinc-700 bg-[#18181b] text-white hover:bg-zinc-800">
              <Link href="/achievements/top-collaborator">Open leaderboard</Link>
            </Button>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Award}
          title="No award data yet"
          description="Start completing milestones and collaborating to unlock award summaries."
        />
      )}
    </div>
  );
}
