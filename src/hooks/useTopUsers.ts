import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { PublicProfileUserWithPoints } from "@/types/profile";

interface TopUsersResponse {
  success: boolean;
  message: string;
  data: PublicProfileUserWithPoints[];
}

export function useTopUsers(query?: string) {
  const url = query
    ? `/api/search/users?query=${encodeURIComponent(query)}`
    : "/api/search/users";

  const { data, error, isLoading, mutate } = useSWR<TopUsersResponse>(url, fetcher);

  return {
    users: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
