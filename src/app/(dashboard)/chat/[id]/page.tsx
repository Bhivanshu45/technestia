"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useChatRoom } from "@/hooks/useChatRoom";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useMarkAsRead } from "@/hooks/useMarkAsRead";
import { useEditMessage, useDeleteMessage } from "@/hooks/useChatMessageActions";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import ForwardMessageModal from "@/components/chat/ForwardMessageModal";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ChatMessage } from "@/types/chat";

export default function ChatRoomPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const chatRoomId = params?.id ? Number(params.id) : null;

  const { chatRoom, isLoading: isLoadingRoom, mutate: mutateRoom } = useChatRoom(chatRoomId);
  const {
    messages,
    unreadInfo,
    isLoading: isLoadingMessages,
    hasMore,
    loadMore,
    mutate: mutateMessages,
    addOptimisticMessage,
    updateMessage,
  } = useChatMessages(chatRoomId);
  const { sendMessage, isSending } = useSendMessage(chatRoomId || 0);
  const { markAsRead } = useMarkAsRead();
  const { editMessage } = useEditMessage();
  const { deleteMessage } = useDeleteMessage();

  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState<ChatMessage | null>(null);

  const currentUserId = session?.user?.id ? Number(session.user.id) : 0;

  // Mark as read when opening chat
  useEffect(() => {
    if (chatRoomId && !hasMarkedAsRead && !isLoadingMessages) {
      markAsRead(chatRoomId);
      setHasMarkedAsRead(true);
    }
  }, [chatRoomId, hasMarkedAsRead, isLoadingMessages, markAsRead]);

  const handleSendMessage = async (content: string, type: "TEXT" | "LINK" | "IMAGE" | "FILE", file?: File) => {
    if (!chatRoomId || !session?.user?.id) return;

    try {
      let messageData: any = {
        messageType: type,
      };

      // Handle file upload
      if (file && (type === "IMAGE" || type === "FILE")) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        await new Promise<void>((resolve, reject) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            const base64Data = base64.split(",")[1]; // Remove data:image/jpeg;base64, prefix
            
            messageData.file = {
              buffer: base64Data,
              type: file.type,
            };
            resolve();
          };
          reader.onerror = reject;
        });
      } else {
        messageData.content = content;
      }

      // Create optimistic message
      const optimisticMessage: ChatMessage = {
        id: Date.now(), // Temporary ID
        chatRoomId,
        senderId: Number(session.user.id),
        message: content || "Uploading...",
        messageType: type,
        cloudinaryPublicId: null,
        isEdited: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        sender: {
          id: Number(session.user.id),
          name: session.user.name || null,
          image: session.user.image || null,
        },
        sending: true,
      };

      // Add optimistic message to UI
      addOptimisticMessage(optimisticMessage);

      // Send message
      const sentMessage = await sendMessage(messageData);

      if (sentMessage) {
        // Replace optimistic message with real one
        updateMessage(optimisticMessage.id, {
          ...sentMessage,
          sending: false,
        });
        mutateMessages(); // Refresh messages
      } else {
        toast.error("Failed to send message");
        updateMessage(optimisticMessage.id, { sending: false });
      }
    } catch (error: any) {
      console.error("Send message error:", error);
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  };

  const handleRefresh = () => {
    mutateRoom();
    mutateMessages();
    toast.success("Messages refreshed");
  };

  const handleEditMessage = async (messageId: number, newContent: string) => {
    try {
      const updatedMessage = await editMessage(messageId, newContent);
      if (updatedMessage) {
        updateMessage(messageId, {
          message: newContent,
          isEdited: true,
        });
        toast.success("Message edited");
        mutateMessages();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to edit message");
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      const success = await deleteMessage(messageId);
      if (success) {
        updateMessage(messageId, {
          message: "This message was deleted",
          isDeleted: true,
        });
        toast.success("Message deleted");
        mutateMessages();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  };

  const handleForwardMessage = (message: ChatMessage) => {
    setMessageToForward(message);
    setForwardModalOpen(true);
  };

  const handleForwardToChat = async (targetChatId: number) => {
    if (!messageToForward || !session?.user?.id) return;

    try {
      // Use sendMessage to forward the message content
      const { sendMessage: sendForward } = useSendMessage(targetChatId);
      
      const messageData: any = {
        messageType: messageToForward.messageType,
        content: messageToForward.message,
      };

      await sendForward(messageData);
      toast.success("Message forwarded");
      setForwardModalOpen(false);
      setMessageToForward(null);
    } catch (error: any) {
      toast.error("Failed to forward message");
    }
  };

  if (!session?.user) {
    router.push("/auth/sign-in");
    return null;
  }

  if (!chatRoomId || isNaN(chatRoomId)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500">Invalid chat room</p>
      </div>
    );
  }

  if (isLoadingRoom) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#18181b]" style={{ top: "88px", left: "256px", right: 0, bottom: 0 }}>
      {/* Header - Fixed at top (doesn't scroll) */}
      <div className="flex-shrink-0 border-b border-zinc-800 z-10">
        <ChatHeader
          chatRoom={chatRoom}
          isLoading={isLoadingRoom}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Messages - Only this scrolls */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isGroupChat={chatRoom?.isGroup || false}
          unreadInfo={unreadInfo}
          hasMore={hasMore}
          isLoading={isLoadingMessages}
          onLoadMore={loadMore}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onForwardMessage={handleForwardMessage}
        />
      </div>

      {/* Input - Fixed at bottom (doesn't scroll) */}
      <div className="flex-shrink-0 border-t border-zinc-800 bg-[#18181b]">
        <MessageInput
          onSendMessage={handleSendMessage}
          isSending={isSending}
        />
      </div>

      {/* Forward Modal */}
      {messageToForward && (
        <ForwardMessageModal
          isOpen={forwardModalOpen}
          onClose={() => {
            setForwardModalOpen(false);
            setMessageToForward(null);
          }}
          message={messageToForward}
          onForward={handleForwardToChat}
          currentChatId={chatRoomId || 0}
        />
      )}
    </div>
  );
}
