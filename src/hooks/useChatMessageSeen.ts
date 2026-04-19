import { useEffect, useState } from "react";
import { getSocket } from "@/socket";

export interface SeenInfo {
  messageId: number;
  userId: number;
  seenAt: Date;
  userName: string | null;
}

interface SeenPayload extends SeenInfo {
  chatRoomId: number;
}

export function useChatMessageSeen(chatRoomId: number | null) {
  const [seenMap, setSeenMap] = useState<Map<number, SeenInfo[]>>(new Map());

  useEffect(() => {
    if (!chatRoomId) {
      setSeenMap(new Map());
      return;
    }

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const handleMessageSeen = (payload: SeenPayload) => {
      if (!payload || payload.chatRoomId !== chatRoomId) return;

      setSeenMap((prev) => {
        const updated = new Map(prev);
        const key = payload.messageId;
        const seenList = updated.get(key) || [];

        const alreadyExists = seenList.some((s) => s.userId === payload.userId);
        if (alreadyExists) return prev;

        updated.set(key, [
          ...seenList,
          {
            messageId: payload.messageId,
            userId: payload.userId,
            seenAt: new Date(payload.seenAt),
            userName: payload.userName ?? null,
          },
        ]);

        return updated;
      });
    };

    socket.on("chat:message:seen", handleMessageSeen);

    return () => {
      socket.off("chat:message:seen", handleMessageSeen);
      setSeenMap(new Map());
    };
  }, [chatRoomId]);

  const getSeenUsers = (messageId: number): SeenInfo[] => {
    return seenMap.get(messageId) || [];
  };

  return { seenMap, getSeenUsers };
}
