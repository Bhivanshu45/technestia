import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ProfileUser } from "@/types/profile";

interface ProfileResponse {
  success: boolean;
  message: string;
  user: ProfileUser;
}

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR<ProfileResponse>(
    "/api/profile/mydata",
    fetcher
  );

  return {
    user: data?.user || null,
    isLoading,
    isError: error,
    mutate,
  };
}
