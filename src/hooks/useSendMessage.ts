import { useState } from "react";
import axiosInstance from "@/lib/axios";
import { SendMessageData, ChatMessage } from "@/types/chat";

export function useSendMessage(chatRoomId: number) {
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async (data: SendMessageData): Promise<ChatMessage | null> => {
    setIsSending(true);
    try {
      const response = await axiosInstance.post(
        `/api/chat/messages/send/${chatRoomId}`,
        data
      );

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      console.error("Failed to send message:", error);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  return { sendMessage, isSending };
}
