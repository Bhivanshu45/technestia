import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { CollaborationInvite } from "@/types/collaboration";

interface InvitesResponse {
  success: boolean;
  message: string;
  invites: CollaborationInvite[];
}

export function useMyInvites() {
  const { data, error, isLoading, mutate } = useSWR<InvitesResponse>(
    "/api/project/invites/my",
    fetcher
  );

  return {
    invites: data?.invites || [],
    isLoading,
    isError: error,
    mutate,
  };
}
