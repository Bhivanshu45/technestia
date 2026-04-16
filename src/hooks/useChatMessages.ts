import { useEffect, useState, useCallback } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { MessagesResponse, ChatMessage } from "@/types/chat";

export function useChatMessages(chatRoomId: number | null) {
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasLoadedOlderMessages, setHasLoadedOlderMessages] = useState(false);

  useEffect(() => {
    setAllMessages([]);
    setPaginationCursor(null);
    setHasMore(true);
    setIsLoadingMore(false);
    setHasLoadedOlderMessages(false);
  }, [chatRoomId]);

  const { data, error, isLoading, mutate } = useSWR<MessagesResponse>(
    chatRoomId ? `/api/chat/messages/fetch/${chatRoomId}?limit=30` : null,
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds when viewing chat
      revalidateOnFocus: true,
      onSuccess: (data) => {
        if (data.messages) {
          setAllMessages((prev) => {
            const messageMap = new Map<number, ChatMessage>();

            prev.forEach((message) => {
              messageMap.set(message.id, message);
            });

            data.messages.forEach((message) => {
              messageMap.set(message.id, {
                ...messageMap.get(message.id),
                ...message,
              });
            });

            return Array.from(messageMap.values()).sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });

          setHasMore(Boolean(hasLoadedOlderMessages ? paginationCursor : data.nextCursor));

          if (!hasLoadedOlderMessages) {
            setPaginationCursor(data.nextCursor);
          }
        }
      },
    }
  );

  const loadMore = useCallback(async () => {
    if (!chatRoomId || !paginationCursor || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const response = await fetcher(
        `/api/chat/messages/fetch/${chatRoomId}?cursor=${paginationCursor}&limit=30`
      );

      const nextPage = response as MessagesResponse;
      const incomingMessages = nextPage.messages || [];

      setHasLoadedOlderMessages(true);

      setAllMessages((prev) => {
        const messageMap = new Map<number, ChatMessage>();

        prev.forEach((message) => {
          messageMap.set(message.id, message);
        });

        incomingMessages.forEach((message) => {
          messageMap.set(message.id, {
            ...messageMap.get(message.id),
            ...message,
          });
        });

        return Array.from(messageMap.values()).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      setPaginationCursor(nextPage.nextCursor);
      setHasMore(Boolean(nextPage.nextCursor));
    } finally {
      setIsLoadingMore(false);
    }
  }, [chatRoomId, paginationCursor, hasMore, isLoadingMore]);

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
    isLoading: isLoading || isLoadingMore,
    isError: error,
    hasMore,
    loadMore,
    mutate,
    addOptimisticMessage,
    updateMessage,
    removeMessage,
  };
}
