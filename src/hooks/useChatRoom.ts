import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ChatRoomDetails } from "@/types/chat";

interface ChatRoomResponse {
  success: boolean;
  data: ChatRoomDetails;
}

export function useChatRoom(chatRoomId: number | null) {
  const { data, error, isLoading, mutate } = useSWR<ChatRoomResponse>(
    chatRoomId ? `/api/chat/get-roomdata/${chatRoomId}` : null,
    fetcher
  );

  return {
    chatRoom: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
}
