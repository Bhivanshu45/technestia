"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useCreateChat } from "@/hooks/useCreateChat";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StartDMButtonProps {
  userId: number;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
  className?: string;
}

export default function StartDMButton({
  userId,
  variant = "ghost",
  size = "sm",
  showText = false,
  className,
}: StartDMButtonProps) {
  const router = useRouter();
  const { createChat, isCreating } = useCreateChat();

  const handleStartDM = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const chatData = await createChat({
        isGroup: false,
        targetUserId: userId,
      });

      if (chatData) {
        router.push(`/chat/${chatData.id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to start chat");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleStartDM}
      disabled={isCreating}
      className={cn("text-zinc-400 hover:text-white", className)}
      title="Start Direct Message"
    >
      {isCreating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <MessageCircle className="h-4 w-4" />
          {showText && <span className="ml-2">Message</span>}
        </>
      )}
    </Button>
  );
}
