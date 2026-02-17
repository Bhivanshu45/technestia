"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useProjects, useCollaboratedProjects } from "@/hooks/useProjects";
import { useMilestoneStats } from "@/hooks/useMilestoneStats";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useTopUsers } from "@/hooks/useTopUsers";
import AchievementStatCard from "@/components/achievements/AchievementStatCard";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Trophy, TrendingUp, Users, CheckCircle, Sparkles } from "lucide-react";

export default function AchievementsPage() {
  const { data: session } = useSession();
  const { projects, isLoading: loadingOwned } = useProjects();
  const { projects: collaboratedProjects, isLoading: loadingCollab } =
    useCollaboratedProjects();
  const { users, isLoading: loadingUsers } = useTopUsers();

  const allProjects = useMemo(() => {
    const map = new Map<number, { id: number; title: string }>();
    projects.forEach((p: any) => map.set(p.id, { id: p.id, title: p.title }));
    collaboratedProjects.forEach((p: any) =>
      map.set(p.id, { id: p.id, title: p.title })
    );
    return Array.from(map.values());
  }, [projects, collaboratedProjects]);

  const { stats, isLoading: loadingMilestones } = useMilestoneStats(allProjects);
  const { activityLogs, isLoading: loadingActivity } = useActivityFeed(allProjects);

  const contributionStats = useMemo(() => {
    const counts: Record<string, number> = {};
    activityLogs.forEach((log: any) => {
      const type = log.actionType || log.activityType || "UNKNOWN";
      counts[type] = (counts[type] || 0) + 1;
    });

    const topActions = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      total: activityLogs.length,
      topActions,
    };
  }, [activityLogs]);

  if (loadingOwned || loadingCollab || loadingMilestones || loadingActivity) {
    return (
      <div className="p-6">
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  const completedRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const topUser = users[0];
  const currentUserId = Number(session?.user?.id || 0);
  const isTopUser = topUser?.id === currentUserId;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Achievements</h1>
          <p className="text-[#A1A1AA] text-sm">
            Track your progress, milestones, and community impact
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/achievements/milestones">
            <Button variant="secondary">Milestones</Button>
          </Link>
          <Link href="/achievements/contributions">
            <Button variant="secondary">Contributions</Button>
          </Link>
          <Link href="/achievements/top-collaborator">
            <Button variant="secondary">Leaderboard</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AchievementStatCard
          label="Milestones completed"
          value={stats.completed}
          subLabel={`${completedRate}% completion rate`}
          icon={<CheckCircle className="h-4 w-4" />}
          accent="green"
        />
        <AchievementStatCard
          label="Contribution events"
          value={contributionStats.total}
          subLabel="Across your projects"
          icon={<TrendingUp className="h-4 w-4" />}
          accent="blue"
        />
        <AchievementStatCard
          label="Top collaborator"
          value={topUser?.name || "No data"}
          subLabel={topUser ? `@${topUser.username}` : ""}
          icon={<Trophy className="h-4 w-4" />}
          accent="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#232326] border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Milestone progress</h2>
                <p className="text-xs text-[#A1A1AA]">
                  {stats.completed} of {stats.total} milestones completed
                </p>
              </div>
              <Link href="/achievements/milestones">
                <Button size="sm" variant="secondary">View details</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
              <AchievementStatCard label="Completed" value={stats.completed} accent="green" />
              <AchievementStatCard label="In Progress" value={stats.inProgress} accent="blue" />
              <AchievementStatCard label="Not Started" value={stats.notStarted} accent="purple" />
              <AchievementStatCard label="Skipped" value={stats.skipped} accent="yellow" />
            </div>
          </div>

          <div className="bg-[#232326] border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Contribution stats</h2>
                <p className="text-xs text-[#A1A1AA]">Top actions across your projects</p>
              </div>
              <Link href="/achievements/contributions">
                <Button size="sm" variant="secondary">View details</Button>
              </Link>
            </div>

            {contributionStats.topActions.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={TrendingUp}
                  title="No contributions yet"
                  description="Your activity will appear here once you start collaborating."
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {contributionStats.topActions.map(([type, count]) => (
                  <div
                    key={type}
                    className="bg-[#18181b] border border-zinc-800 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm text-white font-semibold">
                        {type.replace(/_/g, " ").toLowerCase()}
                      </p>
                      <p className="text-xs text-[#A1A1AA]">Most frequent action</p>
                    </div>
                    <Badge className="bg-blue-900 text-blue-200">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#232326] border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <h2 className="text-lg font-semibold text-white">Top collaborator</h2>
            </div>
            {loadingUsers ? (
              <LoadingSkeleton type="list" />
            ) : topUser ? (
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
            ) : (
              <EmptyState
                icon={Users}
                title="No leaderboard data"
                description="Start collaborating to appear here."
              />
            )}

            {isTopUser && (
              <div className="mt-3">
                <Badge className="bg-yellow-900 text-yellow-200">You lead the board</Badge>
              </div>
            )}

            <div className="mt-4">
              <Link href="/achievements/top-collaborator">
                <Button size="sm" variant="secondary" className="w-full">
                  View leaderboard
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-[#232326] border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Project awards</h2>
            </div>
            <p className="text-xs text-[#A1A1AA]">
              Awards will appear once this feature is enabled.
            </p>
            <div className="mt-4">
              <Link href="/achievements/awards">
                <Button size="sm" variant="secondary" className="w-full">
                  View awards
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-[#232326] border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-purple-300" />
              <h2 className="text-lg font-semibold text-white">Highlights</h2>
            </div>
            <ul className="space-y-2 text-sm text-[#A1A1AA]">
              <li>
                {completedRate >= 70
                  ? "Great momentum — your milestones are moving fast."
                  : completedRate > 0
                  ? "Keep pushing — steady progress builds consistency."
                  : "Create your first milestone to start tracking progress."}
              </li>
              <li>
                {contributionStats.total > 0
                  ? `You've logged ${contributionStats.total} contribution events.`
                  : "Collaborate on a project to build your contribution history."}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
