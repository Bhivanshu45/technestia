"use client";
import React, { useState } from "react";
import ChatRoomCard from "./ChatRoomCard";
import { ChatRoom } from "@/types/chat";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ChatRoomListProps {
  chatRooms: ChatRoom[];
  isLoading: boolean;
}

export default function ChatRoomList({ chatRooms, isLoading }: ChatRoomListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = chatRooms.filter((chat) =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-20 bg-[#232326] border border-zinc-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          type="text"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
        />
      </div>

      {/* Chat List */}
      {filteredChats.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 text-sm">
            {searchQuery ? "No chats found" : "No conversations yet"}
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            {!searchQuery && "Start a new chat to get started"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredChats.map((chatRoom) => (
            <ChatRoomCard key={chatRoom.id} chatRoom={chatRoom} />
          ))}
        </div>
      )}
    </div>
  );
}
