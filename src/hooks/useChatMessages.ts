import { useState, useCallback } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { MessagesResponse, ChatMessage } from "@/types/chat";

export function useChatMessages(chatRoomId: number | null) {
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const { data, error, isLoading, mutate } = useSWR<MessagesResponse>(
    chatRoomId
      ? `/api/chat/messages/fetch/${chatRoomId}${cursor ? `?cursor=${cursor}&limit=30` : "?limit=30"}`
      : null,
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds when viewing chat
      revalidateOnFocus: true,
      onSuccess: (data) => {
        if (data.messages) {
          setAllMessages((prev) => {
            // Avoid duplicates when polling
            const existingIds = new Set(prev.map((m) => m.id));
            const newMessages = data.messages.filter((m) => !existingIds.has(m.id));
            return [...prev, ...newMessages];
          });
          setHasMore(!!data.nextCursor);
        }
      },
    }
  );

  const loadMore = useCallback(() => {
    if (data?.nextCursor && hasMore) {
      setCursor(data.nextCursor);
    }
  }, [data?.nextCursor, hasMore]);

  const addOptimisticMessage = useCallback((message: ChatMessage) => {
    setAllMessages((prev) => [message, ...prev]);
  }, []);

  const updateMessage = useCallback((messageId: number, updates: Partial<ChatMessage>) => {
    setAllMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, ...updates } : m))
    );
  }, []);

  const removeMessage = useCallback((messageId: number) => {
    setAllMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  return {
    messages: allMessages,
    unreadInfo: data?.unreadInfo,
    isLoading,
    isError: error,
    hasMore,
    loadMore,
    mutate,
    addOptimisticMessage,
    updateMessage,
    removeMessage,
  };
}
