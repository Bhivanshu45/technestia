import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { ProjectWithRelations } from '@/types/project';

interface ProjectResponse {
  success: boolean;
  message: string;
  project: ProjectWithRelations;
}

export function useProject(projectId: string | number | null) {
  const { data, error, isLoading, mutate } = useSWR<ProjectResponse>(
    projectId ? `/api/project/details/${projectId}` : null,
    fetcher
  );

  return {
    project: data?.project || null,
    isLoading,
    isError: error,
    mutate,
  };
}
