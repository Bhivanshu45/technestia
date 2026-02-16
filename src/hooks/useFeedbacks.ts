import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Feedback } from '@/types/feedback';

interface FeedbacksResponse {
  success: boolean;
  message: string;
  feedbacks: Feedback[];
}

export function useFeedbacks(projectId: string | number | null) {
  const { data, error, isLoading, mutate } = useSWR<FeedbacksResponse>(
    projectId ? `/api/project/feedbacks/fetch-all/${projectId}` : null,
    fetcher
  );

  return {
    feedbacks: data?.feedbacks || [],
    isLoading,
    isError: error,
    mutate,
  };
}
