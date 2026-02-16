import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { ActivityLog } from '@/types/activity';

interface ActivityLogResponse {
  success: boolean;
  message: string;
  activityLogs: ActivityLog[];
}

export function useActivityLog(projectId: string | number | null) {
  const { data, error, isLoading, mutate } = useSWR<ActivityLogResponse>(
    projectId ? `/api/project/activity-logs/${projectId}` : null,
    fetcher
  );

  return {
    activityLogs: data?.activityLogs || [],
    isLoading,
    isError: error,
    mutate,
  };
}
