import { useCallback } from "react";
import axiosInstance from "@/lib/axios";

export function useMarkAsRead() {
  const markAsRead = useCallback(async (chatRoomId: number) => {
    try {
      await axiosInstance.patch(`/api/chat/mark-read/${chatRoomId}`);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }, []);

  return { markAsRead };
}
