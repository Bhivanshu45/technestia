"use client";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Copy, Forward, Edit, Trash2, MoreVertical } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { toast } from "sonner";

interface MessageActionsProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onForward?: () => void;
}

export default function MessageActions({
  message,
  isOwnMessage,
  onEdit,
  onDelete,
  onForward,
}: MessageActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.message);
      toast.success("Message copied to clipboard");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to copy message");
    }
  };

  const canEdit = isOwnMessage && 
    (message.messageType === "TEXT" || message.messageType === "LINK") &&
    !message.isDeleted &&
    !message.isEdited;

  const canDelete = isOwnMessage && !message.isDeleted;

  // Don't show menu for deleted messages
  if (message.isDeleted) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-zinc-500 hover:bg-zinc-700 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-zinc-800 border border-zinc-700 shadow-lg">
        {/* Copy (available for text messages) */}
        {(message.messageType === "TEXT" || message.messageType === "LINK") && (
          <DropdownMenuItem
            onClick={handleCopy}
            className="text-zinc-200 hover:bg-zinc-700 hover:text-white cursor-pointer"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </DropdownMenuItem>
        )}

        {/* Forward (available for all messages) */}
        {onForward && (
          <DropdownMenuItem
            onClick={() => {
              onForward();
              setIsOpen(false);
            }}
            className="text-zinc-200 hover:bg-zinc-700 hover:text-white cursor-pointer"
          >
            <Forward className="h-4 w-4 mr-2" />
            Forward
          </DropdownMenuItem>
        )}

        {/* Edit (only your TEXT/LINK messages, not edited yet) */}
        {canEdit && onEdit && (
          <DropdownMenuItem
            onClick={() => {
              onEdit();
              setIsOpen(false);
            }}
            className="text-zinc-200 hover:bg-zinc-700 hover:text-white cursor-pointer"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}

        {/* Delete (only your messages) */}
        {canDelete && onDelete && (
          <DropdownMenuItem
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
            className="text-red-500 hover:bg-red-900/20 hover:text-red-400 cursor-pointer"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
