"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useCreateChat } from "@/hooks/useCreateChat";
import { useChatRooms } from "@/hooks/useChatRooms";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProjectChatButtonProps {
  projectId: number;
  projectTitle: string;
  isCollaborator: boolean;
  variant?: "default" | "outline";
  className?: string;
}

export default function ProjectChatButton({
  projectId,
  projectTitle,
  isCollaborator,
  variant = "outline",
  className,
}: ProjectChatButtonProps) {
  const router = useRouter();
  const { createChat, isCreating } = useCreateChat();
  const { chatRooms } = useChatRooms();

  const projectChat = chatRooms.find(
    (room) => room.isGroup && Number(room.projectId) === Number(projectId)
  );
  const unreadCount = projectChat?.unreadCount || 0;

  const handleOpenProjectChat = async () => {
    try {
      // Try to create or get existing project chat
      const chatData = await createChat({
        isGroup: true,
        name: projectTitle,
        projectId,
      });

      if (chatData) {
        router.push(`/chat/${chatData.id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to open team chat");
    }
  };

  if (!isCollaborator) return null;

  return (
    <Button
      variant={variant}
      onClick={handleOpenProjectChat}
      disabled={isCreating}
      className={cn("relative", className)}
    >
      {isCreating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <Users className="h-4 w-4 mr-2" />
          Team Chat
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] font-semibold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </>
      )}
    </Button>
  );
}
