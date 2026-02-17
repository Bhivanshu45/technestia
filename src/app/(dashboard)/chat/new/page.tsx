"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAllUsers } from "@/hooks/useAllUsers";
import { useCreateChat } from "@/hooks/useCreateChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Search, Loader2, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function NewChatPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { users, isLoading: isLoadingUsers } = useAllUsers();
  const { createChat, isCreating } = useCreateChat();

  const [chatType, setChatType] = useState<"direct" | "group">("direct");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [groupName, setGroupName] = useState("");

  const currentUserId = session?.user?.id ? Number(session.user.id) : 0;

  // Filter users (exclude current user)
  const availableUsers = users.filter(
    (user) => user.id !== currentUserId && user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateChat = async () => {
    try {
      if (chatType === "direct") {
        if (selectedUsers.length !== 1) {
          toast.error("Please select exactly one user for a direct message");
          return;
        }

        const chatData = await createChat({
          isGroup: false,
          targetUserId: selectedUsers[0],
        });

        if (chatData) {
          toast.success("Chat created");
          router.push(`/chat/${chatData.id}`);
        }
      } else {
        // Group chat
        if (selectedUsers.length < 1) {
          toast.error("Please select at least one user for a group");
          return;
        }

        if (!groupName.trim()) {
          toast.error("Please enter a group name");
          return;
        }

        const chatData = await createChat({
          isGroup: true,
          name: groupName.trim(),
          participantIds: selectedUsers,
        });

        if (chatData) {
          toast.success("Group chat created");
          router.push(`/chat/${chatData.id}`);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create chat");
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (id: number) => {
    const colors = [
      "bg-blue-600",
      "bg-green-600",
      "bg-purple-600",
      "bg-pink-600",
      "bg-yellow-600",
      "bg-indigo-600",
    ];
    return colors[id % colors.length];
  };

  if (!session?.user) {
    router.push("/auth/sign-in");
    return null;
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">New Chat</h1>
          <p className="text-sm text-zinc-500 mt-1">Start a new conversation</p>
        </div>
      </div>

      {/* Chat Type Selection */}
      <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6 mb-6">
        <Label className="text-zinc-300 mb-3 block">Chat Type</Label>
        <RadioGroup
          value={chatType}
          onValueChange={(value: string) => setChatType(value as "direct" | "group")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="direct" id="direct" />
            <Label htmlFor="direct" className="text-zinc-300 cursor-pointer flex items-center gap-2">
              <User className="h-4 w-4" />
              Direct Message
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="group" id="group" />
            <Label htmlFor="group" className="text-zinc-300 cursor-pointer flex items-center gap-2">
              <Users className="h-4 w-4" />
              Group Chat
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Group Name (if group chat) */}
      {chatType === "group" && (
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6 mb-6">
          <Label htmlFor="groupName" className="text-zinc-300 mb-2 block">
            Group Name *
          </Label>
          <Input
            id="groupName"
            type="text"
            placeholder="Enter group name..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
      )}

      {/* User Selection */}
      <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6">
        <Label className="text-zinc-300 mb-3 block">
          Select {chatType === "direct" ? "User" : "Participants"}{" "}
          {selectedUsers.length > 0 && `(${selectedUsers.length} selected)`}
        </Label>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>

        {/* User List */}
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : availableUsers.length === 0 ? (
            <p className="text-center text-zinc-500 text-sm py-8">
              {searchQuery ? "No users found" : "No users available"}
            </p>
          ) : (
            availableUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  if (chatType === "direct") {
                    setSelectedUsers([user.id]);
                  } else {
                    toggleUserSelection(user.id);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedUsers.includes(user.id)
                    ? "bg-blue-700 border-blue-600"
                    : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
                )}
              >
                {/* Avatar */}
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                      getAvatarColor(user.id)
                    )}
                  >
                    {getInitials(user.name)}
                  </div>
                )}

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-medium truncate",
                      selectedUsers.includes(user.id) ? "text-white" : "text-zinc-300"
                    )}
                  >
                    {user.name || "Unknown User"}
                  </p>
                  <p className="text-xs text-zinc-500">@{user.username || "unknown"}</p>
                </div>

                {/* Checkmark */}
                {selectedUsers.includes(user.id) && (
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <span className="text-blue-700 text-xs">✓</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreateChat}
          disabled={
            isCreating ||
            selectedUsers.length === 0 ||
            (chatType === "direct" && selectedUsers.length !== 1) ||
            (chatType === "group" && !groupName.trim())
          }
          className="bg-blue-700 hover:bg-blue-600 text-white disabled:opacity-50"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            `Create ${chatType === "direct" ? "Chat" : "Group"}`
          )}
        </Button>
      </div>
    </div>
  );
}
