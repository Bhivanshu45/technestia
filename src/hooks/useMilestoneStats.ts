import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Milestone } from "@/types/milestone";

interface MilestonesResponse {
  success: boolean;
  message: string;
  milestones: Milestone[];
}

export interface MilestoneProjectSummary {
  projectId: number;
  projectTitle: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  skipped: number;
}

export interface MilestoneStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  skipped: number;
  byProject: MilestoneProjectSummary[];
}

export function useMilestoneStats(projects: { id: number; title: string }[]) {
  const sortedProjects = [...projects].sort((a, b) => a.id - b.id);
  const key =
    sortedProjects.length > 0
      ? ["milestone-stats", sortedProjects.map((p) => p.id).join(",")]
      : null;

  const { data, error, isLoading, mutate } = useSWR<{ stats: MilestoneStats }>(
    key,
    async () => {
      const responses = await Promise.all(
        sortedProjects.map((project) =>
          fetcher(`/api/project/milestones/fetch-all/${project.id}`)
        )
      );

      const byProject: MilestoneProjectSummary[] = responses.map(
        (res: MilestonesResponse, index) => {
          const milestones = res.milestones || [];
          const summary = {
            projectId: sortedProjects[index].id,
            projectTitle: sortedProjects[index].title,
            total: milestones.length,
            completed: 0,
            inProgress: 0,
            notStarted: 0,
            skipped: 0,
          };

          milestones.forEach((milestone) => {
            switch (milestone.completionStatus) {
              case "COMPLETED":
                summary.completed += 1;
                break;
              case "IN_PROGRESS":
                summary.inProgress += 1;
                break;
              case "NOT_STARTED":
                summary.notStarted += 1;
                break;
              case "SKIPPED":
                summary.skipped += 1;
                break;
              default:
                summary.notStarted += 1;
                break;
            }
          });

          return summary;
        }
      );

      const totals = byProject.reduce(
        (acc, project) => {
          acc.total += project.total;
          acc.completed += project.completed;
          acc.inProgress += project.inProgress;
          acc.notStarted += project.notStarted;
          acc.skipped += project.skipped;
          return acc;
        },
        { total: 0, completed: 0, inProgress: 0, notStarted: 0, skipped: 0 }
      );

      return {
        stats: {
          ...totals,
          byProject,
        },
      };
    }
  );

  return {
    stats: data?.stats || {
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      skipped: 0,
      byProject: [],
    },
    isLoading,
    isError: error,
    mutate,
  };
}
