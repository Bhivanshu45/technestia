import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Project } from '@/types/project';

interface UseProjectsOptions {
  status?: 'IDEA' | 'IN_PROGRESS' | 'COMPLETED';
  isPublic?: boolean;
}

interface ProjectsResponse {
  success: boolean;
  message: string;
  projects: Project[];
}

export function useProjects(options?: UseProjectsOptions) {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.isPublic !== undefined) params.append('isPublic', String(options.isPublic));
  
  const queryString = params.toString();
  const url = `/api/project/user-projects/owned${queryString ? `?${queryString}` : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR<ProjectsResponse>(url, fetcher);

  return {
    projects: data?.projects || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCollaboratedProjects() {
  const { data, error, isLoading, mutate } = useSWR<ProjectsResponse>(
    '/api/project/user-projects/collaborated',
    fetcher
  );

  return {
    projects: data?.projects || [],
    isLoading,
    isError: error,
    mutate,
  };
}
