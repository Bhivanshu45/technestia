import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/socket";

interface PresenceStatePayload {
  chatRoomId: number;
  onlineUserIds: number[];
}

export function useChatPresence(chatRoomId: number | null, userIds: number[]) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());

  const normalizedUserIds = useMemo(() => {
    const ids = userIds
      .map((userId) => Number(userId))
      .filter((userId) => Number.isFinite(userId) && userId > 0);
    return Array.from(new Set(ids)).sort((a, b) => a - b);
  }, [userIds]);

  const userIdsKey = normalizedUserIds.join(",");

  useEffect(() => {
    if (!chatRoomId || normalizedUserIds.length === 0) {
      setOnlineUserIds(new Set());
      return;
    }

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const handlePresenceState = (payload: PresenceStatePayload) => {
      if (!payload || payload.chatRoomId !== chatRoomId) return;
      setOnlineUserIds(new Set(payload.onlineUserIds || []));
    };

    socket.on("chat:presence:state", handlePresenceState);
    socket.emit("chat:presence:subscribe", {
      chatRoomId,
      userIds: normalizedUserIds,
    });

    return () => {
      socket.off("chat:presence:state", handlePresenceState);
      socket.emit("chat:presence:unsubscribe", { chatRoomId });
    };
  }, [chatRoomId, userIdsKey]);

  return {
    onlineUserIds,
    isUserOnline: (userId: number) => onlineUserIds.has(userId),
  };
}
