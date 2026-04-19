import { useCallback } from "react";
import { useSession } from "next-auth/react";
import axiosInstance from "@/lib/axios";
import { getSocket } from "@/socket";

export function useMarkAsRead() {
  const { data: session } = useSession();

  const markAsRead = useCallback(
    async (chatRoomId: number, messageId?: number) => {
      try {
        await axiosInstance.patch(`/api/chat/mark-read/${chatRoomId}`);

        const socket = getSocket();
        if (socket?.connected) {
          socket.emit("chat:message:seen", {
            chatRoomId,
            userId: Number(session?.user?.id),
            messageId: messageId || null,
            seenAt: new Date().toISOString(),
            userName: session?.user?.name || null,
          });
        }
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    },
    [session?.user?.id, session?.user?.name],
  );

  return { markAsRead };
}
