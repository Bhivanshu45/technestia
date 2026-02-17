import { useState } from "react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";

// ===== UPDATE GROUP NAME HOOK =====
interface UpdateGroupNameParams {
  chatRoomId: number;
  newName: string;
}

export function useUpdateGroupName() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateGroupName = async ({ chatRoomId, newName }: UpdateGroupNameParams) => {
    setIsUpdating(true);
    try {
      const response = await axiosInstance.put(`/api/chat/update/chatname/${chatRoomId}`, { name: newName });
      toast.success("Group name updated");
      return response.data.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update group name");
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateGroupName, isUpdating };
}

// ===== UPDATE GROUP AVATAR HOOK =====
interface UpdateGroupAvatarParams {
  chatRoomId: number;
  avatarFile: File;
}

export function useUpdateGroupAvatar() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateGroupAvatar = async ({ chatRoomId, avatarFile }: UpdateGroupAvatarParams) => {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("file", avatarFile);

      const response = await axiosInstance.put(`/api/chat/upload-image/${chatRoomId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Group avatar updated");
      return response.data.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update group avatar");
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateGroupAvatar, isUpdating };
}

// ===== ADD PARTICIPANTS HOOK =====
interface AddParticipantsParams {
  chatRoomId: number;
  userIds: number[];
}

export function useAddParticipants() {
  const [isAdding, setIsAdding] = useState(false);

  const addParticipants = async ({ chatRoomId, userIds }: AddParticipantsParams) => {
    setIsAdding(true);
    try {
      const response = await axiosInstance.post(`/api/chat/participants/add/${chatRoomId}`, { userIds });
      toast.success(`Added ${userIds.length} participant(s)`);
      return response.data.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add participants");
      throw error;
    } finally {
      setIsAdding(false);
    }
  };

  return { addParticipants, isAdding };
}

// ===== REMOVE PARTICIPANT HOOK =====
interface RemoveParticipantParams {
  chatRoomId: number;
  userId: number;
}

export function useRemoveParticipant() {
  const [isRemoving, setIsRemoving] = useState(false);

  const removeParticipant = async ({ chatRoomId, userId }: RemoveParticipantParams) => {
    setIsRemoving(true);
    try {
      const response = await axiosInstance.delete(`/api/chat/participants/remove/${chatRoomId}`, {
        data: { userId },
      });
      toast.success("Participant removed");
      return response.data.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove participant");
      throw error;
    } finally {
      setIsRemoving(false);
    }
  };

  return { removeParticipant, isRemoving };
}
