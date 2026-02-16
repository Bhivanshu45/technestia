import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ActivityLog } from "@/types/activity";

export interface ActivityFeedItem extends ActivityLog {
  projectTitle?: string;
}

interface ActivityFeedResponse {
  success: boolean;
  message: string;
  activityLogs: ActivityLog[];
}

export function useActivityFeed(
  projects: { id: number; title: string }[]
) {
  const sortedProjects = [...projects].sort((a, b) => a.id - b.id);
  const key =
    sortedProjects.length > 0
      ? ["activity-feed", sortedProjects.map((p) => p.id).join(",")]
      : null;

  const { data, error, isLoading, mutate } = useSWR<{
    activityLogs: ActivityFeedItem[];
  }>(key, async () => {
    const results = await Promise.all(
      sortedProjects.map((project) =>
        fetcher(`/api/project/activity-logs/${project.id}`)
      )
    );

    const merged = results.flatMap((res: ActivityFeedResponse, index) => {
      const project = sortedProjects[index];
      return (res.activityLogs || []).map((log) => ({
        ...log,
        projectId: project.id,
        projectTitle: project.title,
      }));
    });

    merged.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { activityLogs: merged };
  });

  return {
    activityLogs: data?.activityLogs || [],
    isLoading,
    isError: error,
    mutate,
  };
}
