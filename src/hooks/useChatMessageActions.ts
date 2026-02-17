import { useState } from "react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { ChatMessage } from "@/types/chat";

// ===== EDIT MESSAGE HOOK =====
export function useEditMessage() {
  const [isEditing, setIsEditing] = useState(false);

  const editMessage = async (messageId: number, newMessage: string) => {
    setIsEditing(true);
    try {
      const response = await axiosInstance.patch(
        `/api/chat/messages/edit/${messageId}`,
        { newMessage }
      );
      toast.success("Message updated");
      return response.data.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to edit message");
      throw error;
    } finally {
      setIsEditing(false);
    }
  };

  return { editMessage, isEditing };
}

// ===== DELETE MESSAGE HOOK =====
export function useDeleteMessage() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteMessage = async (messageId: number) => {
    setIsDeleting(true);
    try {
      const response = await axiosInstance.delete(
        `/api/chat/messages/delete/${messageId}`
      );
      toast.success("Message deleted");
      return response.data.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete message");
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteMessage, isDeleting };
}

// ===== FORWARD MESSAGE HELPER =====
// Note: Forward is handled by re-sending message to another chat
// using useSendMessage hook with the same message content
export function useForwardMessage() {
  return {
    forwardMessage: async (chatRoomId: number, content: string) => {
      // This is handled by useSendMessage with the message content
      // No separate API endpoint exists for forwarding
      return { chatRoomId, content };
    },
  };
}
