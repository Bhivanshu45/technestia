import { useState } from "react";
import axiosInstance from "@/lib/axios";

interface CreateChatData {
  isGroup: boolean;
  name?: string;
  image?: string;
  projectId?: number;
  participantIds?: number[];
  targetUserId?: number;
}

export function useCreateChat() {
  const [isCreating, setIsCreating] = useState(false);

  const createChat = async (data: CreateChatData) => {
    setIsCreating(true);
    try {
      const response = await axiosInstance.post("/api/chat/create", data);

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      console.error("Failed to create chat:", error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return { createChat, isCreating };
}
