import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ChatParticipant } from "@/types/chat";

interface ParticipantsResponse {
  success: boolean;
  message: string;
  participants: ChatParticipant[];
}

export function useChatParticipants(chatRoomId: number | null) {
  const { data, error, isLoading, mutate } = useSWR<ParticipantsResponse>(
    chatRoomId ? `/api/chat/participants/fetch/${chatRoomId}` : null,
    fetcher
  );

  return {
    participants: data?.participants || [],
    isLoading,
    isError: error,
    mutate,
  };
}
