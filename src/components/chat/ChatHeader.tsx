"use client";
import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MoreVertical,
  RefreshCw,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatRoomDetails } from "@/types/chat";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  chatRoom: ChatRoomDetails | undefined;
  isLoading: boolean;
  onRefresh: () => void;
  typingText?: string | null;
  presenceText?: string | null;
  lastSeenAt?: Date | null;
  onOpenSettings?: () => void;
  onRequestLeaveOrDelete?: () => void;
  leaveOrDeleteLabel?: string;
}

export default function ChatHeader({
  chatRoom,
  isLoading,
  onRefresh,
  typingText,
  presenceText,
  lastSeenAt,
  onOpenSettings,
  onRequestLeaveOrDelete,
  leaveOrDeleteLabel,
}: ChatHeaderProps) {
  const getInitials = (name: string | null | undefined) => {
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

  const formatLastSeenTime = (date: Date | null | undefined): string | null => {
    if (!date) return null;
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return null;
  };

  const statusText = (() => {
    // Priority: typing > presence > last seen (DM only) > participant count
    if (typingText) return typingText;
    
    if (presenceText) {
      const lastSeenTime = !chatRoom?.isGroup && lastSeenAt ? formatLastSeenTime(lastSeenAt) : null;
      return lastSeenTime ? `${presenceText} • Seen ${lastSeenTime}` : presenceText;
    }

    if (!chatRoom?.isGroup && lastSeenAt) {
      const lastSeenTime = formatLastSeenTime(lastSeenAt);
      return lastSeenTime ? `Seen ${lastSeenTime}` : null;
    }

    if (chatRoom?.isGroup && chatRoom.totalParticipants) {
      return `${chatRoom.totalParticipants} participant${chatRoom.totalParticipants !== 1 ? "s" : ""}`;
    }

    return null;
  })();

  const displayName = chatRoom?.isGroup
    ? chatRoom.name
    : chatRoom?.otherUser?.name || "Unknown";

  const displayImage = chatRoom?.isGroup
    ? chatRoom.image
    : chatRoom?.otherUser?.image;

  return (
    <div className="sticky top-0 z-10 bg-[#18181b] border-b border-zinc-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <Link href="/chat">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:bg-blue-600 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          {/* Avatar */}
          {isLoading ? (
            <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse" />
          ) : displayImage ? (
            <img
              src={displayImage}
              alt={displayName || "Chat"}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                getAvatarColor(chatRoom?.id || 0)
              )}
            >
              {getInitials(displayName)}
            </div>
          )}

          {/* Name & Participants Count */}
          <div>
            {isLoading ? (
              <div className="h-5 w-32 bg-zinc-800 rounded animate-pulse" />
            ) : (
              <>
                <h2 className="text-base font-semibold text-zinc-100">
                  {displayName}
                </h2>
                {statusText ? (
                  <p className={cn(
                    "text-xs",
                    typingText ? "text-blue-400" : "text-zinc-400"
                  )}>
                    {statusText}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-8 w-8 p-0 text-zinc-400 hover:bg-blue-600 hover:text-white transition-colors"
            title="Refresh messages"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-zinc-400 hover:bg-blue-600 hover:text-white transition-colors"
                title="More actions"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#232326] border-zinc-800 text-zinc-100"
            >
              {chatRoom?.isGroup && chatRoom.isAdmin && onOpenSettings && (
                <DropdownMenuItem
                  onClick={onOpenSettings}
                  className="cursor-pointer gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Group settings
                </DropdownMenuItem>
              )}
              {onRequestLeaveOrDelete && (
                <DropdownMenuItem
                  onClick={onRequestLeaveOrDelete}
                  className="cursor-pointer gap-2 text-red-400 focus:text-red-300"
                >
                  <LogOut className="h-4 w-4" />
                  {leaveOrDeleteLabel || "Leave chat"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
