import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Milestone } from '@/types/milestone';

interface MilestonesResponse {
  success: boolean;
  message: string;
  milestones: Milestone[];
}

export function useMilestones(projectId: string | number | null) {
  const { data, error, isLoading, mutate } = useSWR<MilestonesResponse>(
    projectId ? `/api/project/milestones/fetch-all/${projectId}` : null,
    fetcher
  );

  return {
    milestones: data?.milestones || [],
    isLoading,
    isError: error,
    mutate,
  };
}
