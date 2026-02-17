import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ChatRoom } from "@/types/chat";

interface ChatRoomsResponse {
  success: boolean;
  message: string;
  chatRooms: ChatRoom[];
}

export function useChatRooms() {
  const { data, error, isLoading, mutate } = useSWR<ChatRoomsResponse>(
    "/api/chat/fetch-rooms",
    fetcher,
    {
      refreshInterval: 10000, // Poll every 10 seconds for new messages
      revalidateOnFocus: true,
    }
  );

  return {
    chatRooms: data?.chatRooms || [],
    totalUnreadCount: data?.chatRooms?.reduce((sum, chat) => sum + chat.unreadCount, 0) || 0,
    isLoading,
    isError: error,
    mutate,
  };
}
