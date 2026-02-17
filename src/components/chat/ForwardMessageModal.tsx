"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatRoom, ChatMessage } from "@/types/chat";
import { useChatRooms } from "@/hooks/useChatRooms";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ChatMessage;
  onForward: (chatRoomId: number) => void;
  currentChatId: number;
}

export default function ForwardMessageModal({
  isOpen,
  onClose,
  message,
  onForward,
  currentChatId,
}: ForwardMessageModalProps) {
  const { chatRooms, isLoading } = useChatRooms();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  const filteredChats = chatRooms.filter(
    (chat) =>
      chat.id !== currentChatId &&
      chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleForward = () => {
    if (selectedChatId) {
      onForward(selectedChatId);
      setSelectedChatId(null);
      setSearchQuery("");
      onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#232326] border-zinc-800 text-zinc-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Forward Message</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>

        {/* Message Preview */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 mb-4">
          <p className="text-xs text-zinc-500 mb-1">Message to forward:</p>
          <p className="text-sm text-zinc-300 truncate">
            {message.messageType === "IMAGE"
              ? "📷 Image"
              : message.messageType === "FILE"
              ? "📄 File"
              : message.message}
          </p>
        </div>

        {/* Chat List */}
        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : filteredChats.length === 0 ? (
            <p className="text-center text-zinc-500 text-sm py-8">
              {searchQuery ? "No chats found" : "No other chats available"}
            </p>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedChatId === chat.id
                    ? "bg-blue-700 border-blue-600"
                    : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
                )}
              >
                {/* Avatar */}
                {chat.image ? (
                  <img
                    src={chat.image}
                    alt={chat.name || "Chat"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                      getAvatarColor(chat.id)
                    )}
                  >
                    {getInitials(chat.name)}
                  </div>
                )}

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-medium truncate",
                      selectedChatId === chat.id ? "text-white" : "text-zinc-300"
                    )}
                  >
                    {chat.name || "Unknown Chat"}
                  </p>
                  {chat.isGroup && (
                    <p className="text-xs text-zinc-500">Group Chat</p>
                  )}
                </div>

                {/* Checkmark */}
                {selectedChatId === chat.id && (
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <span className="text-blue-700 text-xs">✓</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-800">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleForward}
            disabled={!selectedChatId}
            className="bg-blue-700 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            Forward
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
