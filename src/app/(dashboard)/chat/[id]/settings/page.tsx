"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChatRoom } from "@/hooks/useChatRoom";
import { useChatParticipants } from "@/hooks/useChatParticipants";
import {
  useUpdateGroupName,
  useUpdateGroupAvatar,
  useAddParticipants,
  useRemoveParticipant,
} from "@/hooks/useChatGroupActions";
import { useAllUsers } from "@/hooks/useAllUsers";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Camera,
  Edit2,
  UserPlus,
  UserMinus,
  Loader2,
  Check,
  X,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";

export default function GroupSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const chatRoomId = parseInt(params.id);

  const { chatRoom, isLoading: isLoadingRoom, isError: roomError, mutate: mutateRoom } = useChatRoom(chatRoomId);
  const { participants, isLoading: isLoadingParticipants, isError: participantsError, mutate: mutateParticipants } = useChatParticipants(chatRoomId);
  const { users, isLoading: isLoadingUsers } = useAllUsers();

  const { updateGroupName, isUpdating: isUpdatingName } = useUpdateGroupName();
  const { updateGroupAvatar, isUpdating: isUpdatingAvatar } = useUpdateGroupAvatar();
  const { addParticipants, isAdding } = useAddParticipants();
  const { removeParticipant, isRemoving } = useRemoveParticipant();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = session?.user;
  const currentUserId = currentUser?.id ? Number(currentUser.id) : undefined;
  const isAdmin = participants?.find((p) => p.userId === currentUserId)?.isAdmin;

  const isLoading = isLoadingRoom || isLoadingParticipants;
  const error = roomError || participantsError;

  // Handle group name update
  const handleUpdateName = async () => {
    if (!newName.trim()) {
      toast.error("Group name cannot be empty");
      return;
    }

    try {
      await updateGroupName({ chatRoomId, newName: newName.trim() });
      await mutateRoom();
      setIsEditingName(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    try {
      await updateGroupAvatar({ chatRoomId, avatarFile: file });
      await mutateRoom();
    } catch (error) {
      // Error handled in hook
    }
  };

  // Handle add members
  const handleAddMembers = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    try {
      await addParticipants({ chatRoomId, userIds: selectedUserIds });
      await mutateParticipants();
      setShowAddMembersModal(false);
      setSelectedUserIds([]);
      setSearchQuery("");
    } catch (error) {
      // Error handled in hook
    }
  };

  // Handle remove participant
  const handleRemoveParticipant = async (userId: number) => {
    if (!confirm("Are you sure you want to remove this participant?")) return;

    try {
      await removeParticipant({ chatRoomId, userId });
      await mutateParticipants();
    } catch (error) {
      // Error handled in hook
    }
  };

  // Filter users for add members modal
  const availableUsers = users?.filter((user) => {
    const isAlreadyMember = participants?.some((p) => p.userId === user.id);
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return !isAlreadyMember && matchesSearch;
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message="Failed to load group settings" />;
  if (!chatRoom?.isGroup) {
    router.push(`/chat/${chatRoomId}`);
    return null;
  }
  if (!isAdmin) {
    toast.error("Only admins can access group settings");
    router.push(`/chat/${chatRoomId}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-[#18181b]">
      {/* Header */}
      <div className="bg-[#232326] border-b border-zinc-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-white">Group Settings</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Group Avatar */}
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Group Avatar</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              {chatRoom.image ? (
                <img
                  src={chatRoom.image}
                  alt={chatRoom.name || "Group"}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-700 flex items-center justify-center text-white text-3xl font-bold">
                  {chatRoom.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUpdatingAvatar}
                className="absolute bottom-0 right-0 bg-blue-700 hover:bg-blue-600 p-2 rounded-full transition-colors disabled:opacity-50"
              >
                {isUpdatingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="text-sm text-zinc-400">
              Click the camera icon to upload a new group avatar
            </p>
          </div>
        </div>

        {/* Group Name */}
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Group Name</h2>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter group name"
                className="flex-1"
                autoFocus
              />
              <Button
                size="icon"
                onClick={handleUpdateName}
                disabled={isUpdatingName}
              >
                {isUpdatingName ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setIsEditingName(false);
                  setNewName("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-white">{chatRoom.name}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setNewName(chatRoom.name || "");
                  setIsEditingName(true);
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Members */}
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Members ({participants?.length || 0})
            </h2>
            <Button onClick={() => setShowAddMembersModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Members
            </Button>
          </div>

          <div className="space-y-3">
            {participants?.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 bg-[#18181b] border border-zinc-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {participant.user.image ? (
                    <img
                      src={participant.user.image}
                      alt={participant.user.username || "User"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-semibold">
                      {participant.user.username?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">{participant.user.username}</p>
                    {participant.user.name && (
                      <p className="text-sm text-zinc-400">{participant.user.name}</p>
                    )}
                  </div>
                  {participant.isAdmin && (
                    <div title="Admin">
                      <Shield className="h-4 w-4 text-blue-500" />
                    </div>
                  )}
                </div>

                {participant.userId !== currentUserId && !participant.isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveParticipant(participant.userId)}
                    disabled={isRemoving}
                    className="text-red-500 hover:text-red-400 hover:bg-red-950/20"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Members Modal */}
      <Dialog open={showAddMembersModal} onOpenChange={setShowAddMembersModal}>
        <DialogContent className="bg-[#232326] border-zinc-800 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Add Members</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {isLoadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableUsers?.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUserIds((prev) =>
                        prev.includes(user.id)
                          ? prev.filter((id) => id !== user.id)
                          : [...prev, user.id]
                      );
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedUserIds.includes(user.id)
                        ? "bg-blue-700/20 border-blue-700"
                        : "bg-[#18181b] border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">{user.username}</p>
                      {user.name && <p className="text-sm text-zinc-400">{user.name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddMembersModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMembers} disabled={isAdding || selectedUserIds.length === 0}>
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                `Add ${selectedUserIds.length} Member(s)`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
