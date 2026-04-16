"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useProjects, useCollaboratedProjects } from "@/hooks/useProjects";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import ActivityTimeline from "@/components/activity/ActivityTimeline";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Bell, Activity, Sparkles } from "lucide-react";

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { projects, isLoading: loadingOwned, isError: ownedError } = useProjects();
  const { projects: collaboratedProjects, isLoading: loadingCollab, isError: collabError } =
    useCollaboratedProjects();

  const allProjects = useMemo(() => {
    const map = new Map<number, { id: number; title: string }>();
    projects.forEach((project: any) => map.set(project.id, { id: project.id, title: project.title }));
    collaboratedProjects.forEach((project: any) =>
      map.set(project.id, { id: project.id, title: project.title })
    );
    return Array.from(map.values());
  }, [projects, collaboratedProjects]);

  const { activityLogs, isLoading, isError, mutate } = useActivityFeed(allProjects);
  const latestActivity = activityLogs[0];

  if (loadingOwned || loadingCollab || isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  if (ownedError || collabError || isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load notifications"
          message="We couldn't fetch your recent updates right now."
          onRetry={() => mutate()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Notifications</h1>
          <p className="text-[#A1A1AA] text-sm">
            A focused view of recent project activity across your workspace.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-zinc-700 bg-[#232326] text-white hover:bg-zinc-800">
            <Link href="/activity">Activity log</Link>
          </Button>
          <Button asChild>
            <Link href="/projects">Projects</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
          <Bell className="h-5 w-5 text-blue-400 mb-2" />
          <p className="text-xs text-[#A1A1AA]">Recent notifications</p>
          <p className="text-2xl font-bold text-white mt-1">{activityLogs.length}</p>
        </div>
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
          <Activity className="h-5 w-5 text-green-400 mb-2" />
          <p className="text-xs text-[#A1A1AA]">Projects tracked</p>
          <p className="text-2xl font-bold text-white mt-1">{allProjects.length}</p>
        </div>
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
          <Sparkles className="h-5 w-5 text-yellow-400 mb-2" />
          <p className="text-xs text-[#A1A1AA]">Latest update</p>
          <p className="text-sm font-semibold text-white mt-1 truncate">
            {latestActivity ? latestActivity.description || latestActivity.actionType : "No recent updates"}
          </p>
        </div>
      </div>

      {activityLogs.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Activity will appear here when your projects start moving."
          actionLabel="Open projects"
          onAction={() => router.push("/projects")}
        />
      ) : (
        <ActivityTimeline
          items={activityLogs}
          currentUserId={Number(session?.user?.id || 0)}
        />
      )}
    </div>
  );
}