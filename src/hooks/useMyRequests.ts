import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { CollaborationRequest } from "@/types/collaboration";

interface RequestsResponse {
  success: boolean;
  message: string;
  requests: CollaborationRequest[];
}

export function useMyRequests() {
  const { data, error, isLoading, mutate } = useSWR<RequestsResponse>(
    "/api/project/requests/my",
    fetcher
  );

  return {
    requests: data?.requests || [],
    isLoading,
    isError: error,
    mutate,
  };
}
