import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { PublicProfileUser } from "@/types/profile";

interface UsersResponse {
  success: boolean;
  message: string;
  users: PublicProfileUser[];
}

export function useAllUsers() {
  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    "/api/profile/get-all-users",
    fetcher
  );

  return {
    users: data?.users || [],
    isLoading,
    isError: error,
    mutate,
  };
}
