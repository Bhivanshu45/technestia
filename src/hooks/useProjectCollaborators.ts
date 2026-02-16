import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { CollaboratorEntry } from "@/types/collaboration";

interface CollaboratorsResponse {
  success: boolean;
  message: string;
  collaborators: CollaboratorEntry[];
}

export function useProjectCollaborators(projectId: string | number | null) {
  const { data, error, isLoading, mutate } = useSWR<CollaboratorsResponse>(
    projectId ? `/api/project/collaborators/${projectId}` : null,
    fetcher
  );

  return {
    collaborators: data?.collaborators || [],
    isLoading,
    isError: error,
    mutate,
  };
}
