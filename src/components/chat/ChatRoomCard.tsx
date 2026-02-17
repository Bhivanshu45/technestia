"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatRoom } from "@/types/chat";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatRoomCardProps {
  chatRoom: ChatRoom;
}

export default function ChatRoomCard({ chatRoom }: ChatRoomCardProps) {
  const pathname = usePathname();
  const isActive = pathname === `/chat/${chatRoom.id}`;

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (date: Date | null) => {
    if (!date) return "";
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "";
    }
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
    <Link href={`/chat/${chatRoom.id}`}>
      <div
        className={cn(
          "flex items-center gap-3 p-4 rounded-lg border transition-colors duration-200",
          isActive
            ? "bg-blue-700 border-blue-600 shadow-sm"
            : "bg-[#232326] border-zinc-800 hover:bg-zinc-800/50"
        )}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {chatRoom.image ? (
            <img
              src={chatRoom.image}
              alt={chatRoom.name || "Chat"}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                getAvatarColor(chatRoom.id)
              )}
            >
              {getInitials(chatRoom.name)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3
              className={cn(
                "font-medium truncate",
                isActive ? "text-white" : "text-zinc-100"
              )}
            >
              {chatRoom.name || "Unknown Chat"}
            </h3>
            <span
              className={cn(
                "text-xs flex-shrink-0",
                isActive ? "text-zinc-200" : "text-zinc-500"
              )}
            >
              {formatTimestamp(chatRoom.latestMessageAt)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                "text-sm truncate",
                isActive ? "text-zinc-200" : "text-zinc-400"
              )}
            >
              {chatRoom.latestMessageSender && !chatRoom.isGroup
                ? ""
                : chatRoom.latestMessageSender
                ? `${chatRoom.latestMessageSender}: `
                : ""}
              {chatRoom.latestMessage || "No messages yet"}
            </p>

            {chatRoom.unreadCount > 0 && (
              <span className="flex-shrink-0 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                {chatRoom.unreadCount > 9 ? "9+" : chatRoom.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
