"use client";
import React, { useState } from "react";
import { ChatMessage as ChatMessageType } from "@/types/chat";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { Download, FileText } from "lucide-react";
import MessageActions from "./MessageActions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessageType;
  isOwnMessage: boolean;
  showAvatar: boolean;
  isGroupChat: boolean;
  onEdit?: (messageId: number, newContent: string) => void;
  onDelete?: (messageId: number) => void;
  onForward?: (message: ChatMessageType) => void;
}

export default function MessageBubble({
  message,
  isOwnMessage,
  showAvatar,
  isGroupChat,
  onEdit,
  onDelete,
  onForward,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.message);

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(message.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(message.message);
    setIsEditing(false);
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

  const formatTime = (date: Date | string) => {
    try {
      const messageDate = new Date(date);
      if (isToday(messageDate)) {
        return format(messageDate, "h:mm a");
      } else if (isYesterday(messageDate)) {
        return `Yesterday ${format(messageDate, "h:mm a")}`;
      } else {
        return format(messageDate, "MMM d, h:mm a");
      }
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

  const renderMessageContent = () => {
    if (message.isDeleted) {
      return (
        <p className="text-zinc-600 italic text-sm">This message was deleted</p>
      );
    }

    switch (message.messageType) {
      case "IMAGE":
        return (
          <div className="max-w-sm">
            <img
              src={message.message}
              alt="Shared image"
              className="rounded-lg w-full h-auto"
            />
          </div>
        );

      case "FILE":
        return (
          <a
            href={message.message}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <FileText className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-zinc-100">View File</span>
            <Download className="h-4 w-4 text-zinc-400 ml-auto" />
          </a>
        );

      case "LINK":
        return (
          <a
            href={message.message}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-300 hover:text-blue-200 hover:underline break-all text-sm font-medium"
          >
            {message.message}
          </a>
        );

      default:
        return (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.message}
          </p>
        );
    }
  };

  return (
    <div
      className={cn(
        "flex gap-2 px-6 py-1",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar (only for others in group chats) */}
      {!isOwnMessage && isGroupChat && (
        <div className="flex-shrink-0">
          {showAvatar ? (
            message.sender.image ? (
              <img
                src={message.sender.image}
                alt={message.sender.name || "User"}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs",
                  getAvatarColor(message.sender.id)
                )}
              >
                {getInitials(message.sender.name)}
              </div>
            )
          ) : (
            <div className="w-8 h-8" /> // Spacer
          )}
        </div>
      )}

      {/* Message Content */}
      <div
        className={cn(
          "flex flex-col max-w-[70%] group",
          isOwnMessage ? "items-end" : "items-start"
        )}
      >
        {/* Sender Name (only for others in group chats, when showing avatar) */}
        {!isOwnMessage && isGroupChat && showAvatar && (
          <span className="text-xs text-zinc-500 mb-1 ml-2">
            {message.sender.name || "Unknown"}
          </span>
        )}

        {/* Message Bubble with Actions */}
        <div className="relative flex items-start gap-2">
          <div
            className={cn(
              "rounded-lg p-3",
              isOwnMessage
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 border border-zinc-700 text-zinc-100",
              message.sending && "opacity-50"
            )}
          >
            {isEditing ? (
              // Edit Mode
              <div className="min-w-[200px]">
                <Input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 mb-2"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveEdit();
                    } else if (e.key === "Escape") {
                      handleCancelEdit();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="bg-green-600 hover:bg-green-700 text-white h-7"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white h-7"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              renderMessageContent()
            )}
          </div>

          {/* Message Actions */}
          {!isEditing && (
            <MessageActions
              message={message}
              isOwnMessage={isOwnMessage}
              onEdit={
                onEdit && !message.isDeleted && !message.isEdited
                  ? () => setIsEditing(true)
                  : undefined
              }
              onDelete={onDelete ? () => onDelete(message.id) : undefined}
              onForward={onForward ? () => onForward(message) : undefined}
            />
          )}
        </div>

        {/* Timestamp & Edited indicator */}
        <div className="flex items-center gap-2 mt-1 px-2">
          <span className="text-[10px] text-zinc-500">{formatTime(message.createdAt)}</span>
          {message.isEdited && (
            <span className="text-[10px] text-zinc-500 italic">Edited</span>
          )}
        </div>
      </div>
    </div>
  );
}
