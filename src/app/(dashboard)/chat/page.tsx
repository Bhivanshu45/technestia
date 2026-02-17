"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { useChatRooms } from "@/hooks/useChatRooms";
import ChatRoomList from "@/components/chat/ChatRoomList";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ChatPage() {
  const { data: session } = useSession();
  const { chatRooms, isLoading, isError } = useChatRooms();

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500">Please sign in to view your chats.</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load chats</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Messages</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </span>
            ) : (
              `${chatRooms.length} conversation${chatRooms.length !== 1 ? "s" : ""}`
            )}
          </p>
        </div>

        <Link href="/chat/new">
          <Button className="bg-blue-700 hover:bg-blue-600 text-white">
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </Link>
      </div>

      {/* Chat List */}
      <ChatRoomList chatRooms={chatRooms} isLoading={isLoading} />
    </div>
  );
}
