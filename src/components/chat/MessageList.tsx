"use client";
import React, { useRef, useEffect, useState } from "react";
import { ChatMessage } from "@/types/chat";
import MessageBubble from "./MessageBubble";
import DateSeparator from "./DateSeparator";
import UnreadDivider from "./UnreadDivider";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: number;
  isGroupChat: boolean;
  unreadInfo?: {
    unreadCount: number;
    firstUnreadMessageId: number | null;
  };
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onEditMessage?: (messageId: number, newContent: string) => void;
  onDeleteMessage?: (messageId: number) => void;
  onForwardMessage?: (message: ChatMessage) => void;
}

export default function MessageList({
  messages,
  currentUserId,
  isGroupChat,
  unreadInfo,
  hasMore,
  isLoading,
  onLoadMore,
  onEditMessage,
  onDeleteMessage,
  onForwardMessage,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const prevMessagesLengthRef = useRef(messages.length);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current && shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, shouldAutoScroll]);

  // Detect if user scrolled up
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isAtBottom);
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  // Group messages by date and add separators
  const renderMessages = () => {
    const elements: React.ReactElement[] = [];
    let lastDate: Date | null = null;
    let lastSenderId: number | null = null;
    let unreadDividerAdded = false;

    // Sort messages by date (oldest first for display)
    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sortedMessages.forEach((message, index) => {
      const messageDate = new Date(message.createdAt);
      const isOwnMessage = message.senderId === currentUserId;

      // Add date separator if date changed
      if (!lastDate || !isSameDay(messageDate, lastDate)) {
        elements.push(
          <DateSeparator key={`date-${index}`} date={getDateLabel(messageDate)} />
        );
        lastDate = messageDate;
        lastSenderId = null; // Reset sender for new date
      }

      // Add unread divider before first unread message
      if (
        !unreadDividerAdded &&
        unreadInfo &&
        unreadInfo.firstUnreadMessageId === message.id &&
        unreadInfo.unreadCount > 0
      ) {
        elements.push(
          <UnreadDivider key={`unread-${index}`} count={unreadInfo.unreadCount} />
        );
        unreadDividerAdded = true;
      }

      // Determine if we should show avatar (only when sender changes in groups)
      const showAvatar = isGroupChat && message.senderId !== lastSenderId;

      elements.push(
        <MessageBubble
          key={message.id}
          message={message}
          isOwnMessage={isOwnMessage}
          showAvatar={showAvatar}
          isGroupChat={isGroupChat}
          onEdit={onEditMessage}
          onDelete={onDeleteMessage}
          onForward={onForwardMessage}
        />
      );

      lastSenderId = message.senderId;
    });

    return elements;
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-zinc-500 text-sm">No messages yet</p>
          <p className="text-zinc-600 text-xs mt-1">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto py-4"
    >
      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mb-4">
          <Button
            onClick={onLoadMore}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="bg-[#232326] border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load older messages"
            )}
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="space-y-2">{renderMessages()}</div>

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
