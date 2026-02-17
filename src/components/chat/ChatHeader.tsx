"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatRoomDetails } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  chatRoom: ChatRoomDetails | undefined;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenParticipants?: () => void;
}

export default function ChatHeader({
  chatRoom,
  isLoading,
  onRefresh,
  onOpenParticipants,
}: ChatHeaderProps) {
  const router = useRouter();

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
                {chatRoom?.isGroup && chatRoom.totalParticipants && (
                  <p className="text-xs text-zinc-500">
                    {chatRoom.totalParticipants} participant
                    {chatRoom.totalParticipants !== 1 ? "s" : ""}
                  </p>
                )}
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

          {/* Participants Button (Groups Only) */}
          {chatRoom?.isGroup && onOpenParticipants && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenParticipants}
              className="h-8 w-8 p-0 text-zinc-400 hover:bg-blue-600 hover:text-white transition-colors"
              title="View participants"
            >
              <Users className="h-5 w-5" />
            </Button>
          )}

          {/* Settings Button (Admins Only) */}
          {chatRoom?.isGroup && chatRoom.isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/chat/${chatRoom.id}/settings`)}
              className="h-8 w-8 p-0 text-zinc-400 hover:bg-blue-600 hover:text-white transition-colors"
              title="Group settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
