"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useChatRoom } from "@/hooks/useChatRoom";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useMarkAsRead } from "@/hooks/useMarkAsRead";
import { useChatMessageSeen } from "@/hooks/useChatMessageSeen";
import {
  useEditMessage,
  useDeleteMessage,
} from "@/hooks/useChatMessageActions";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import ForwardMessageModal from "@/components/chat/ForwardMessageModal";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ChatMessage } from "@/types/chat";
import { useChatPresence } from "@/hooks/useChatPresence";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getSocket } from "@/socket";

export default function ChatRoomPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const chatRoomId = params?.id ? Number(params.id) : null;

  const {
    chatRoom,
    isLoading: isLoadingRoom,
    mutate: mutateRoom,
  } = useChatRoom(chatRoomId);
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
  const [messageToForward, setMessageToForward] = useState<ChatMessage | null>(
    null,
  );
  const [showChatActionDialog, setShowChatActionDialog] = useState(false);
  const [isChatActionLoading, setIsChatActionLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<number, string | null>>(
    {},
  );
  const seenMessageIdsRef = useRef<Set<number>>(new Set());

  const currentUserId = session?.user?.id ? Number(session.user.id) : 0;
  const presenceTargetUserIds =
    !chatRoom?.isGroup && chatRoom?.otherUser?.id ? [chatRoom.otherUser.id] : [];
  const { isUserOnline } = useChatPresence(chatRoomId, presenceTargetUserIds);
  const { seenMap, getSeenUsers } = useChatMessageSeen(chatRoomId);

  // Mark as read when opening chat
  useEffect(() => {
    if (chatRoomId && !hasMarkedAsRead && !isLoadingMessages) {
      markAsRead(chatRoomId);
      setHasMarkedAsRead(true);
      
      // Clear unread divider by setting unreadInfo to empty
      mutateMessages(
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            unreadInfo: {
              unreadCount: 0,
              firstUnreadMessageId: null,
            },
          };
        },
        { revalidate: false }
      );
    }
  }, [chatRoomId, hasMarkedAsRead, isLoadingMessages, markAsRead, mutateMessages]);

  useEffect(() => {
    for (const msg of messages) {
      seenMessageIdsRef.current.add(msg.id);
    }
  }, [messages]);

  // socket io event fire and listen
  useEffect(() => {
    if (!chatRoomId || !session?.user?.id) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const myUserId = Number(session.user.id);

    socket.emit("joinRoom", { chatRoomId });

    const handleNewMessage = (incoming: ChatMessage) => {
      if (!incoming) return;
      if (incoming.chatRoomId !== chatRoomId) return;

      if (incoming.senderId === myUserId) return;

      if (seenMessageIdsRef.current.has(incoming.id)) return;

      seenMessageIdsRef.current.add(incoming.id);

      addOptimisticMessage({
        ...incoming,
        sending: false,
      });

      // Clear unread divider info since message is visible
      mutateMessages(
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            unreadInfo: {
              unreadCount: 0,
              firstUnreadMessageId: null,
            },
          };
        },
        { revalidate: false }
      );

      markAsRead(chatRoomId, incoming.id);
    };

    const handleTypingStart = (payload: {
      chatRoomId: number;
      userId: number;
      userName?: string | null;
    }) => {
      if (!payload || payload.chatRoomId !== chatRoomId) return;
      if (payload.userId === myUserId) return;
      setTypingUsers((prev) => ({
        ...prev,
        [payload.userId]: payload.userName ?? null,
      }));
    };

    const handleTypingStop = (payload: { chatRoomId: number; userId: number }) => {
      if (!payload || payload.chatRoomId !== chatRoomId) return;
      setTypingUsers((prev) => {
        if (!(payload.userId in prev)) return prev;
        const next = { ...prev };
        delete next[payload.userId];
        return next;
      });
    };

    socket.on("chat:message:new", handleNewMessage);
    socket.on("chat:typing:start", handleTypingStart);
    socket.on("chat:typing:stop", handleTypingStop);

    return () => {
      socket.emit("leaveRoom", { chatRoomId });
      socket.off("chat:message:new", handleNewMessage);
      socket.off("chat:typing:start", handleTypingStart);
      socket.off("chat:typing:stop", handleTypingStop);
      setTypingUsers({});
    };
  }, [chatRoomId, session?.user?.id, addOptimisticMessage, markAsRead, mutateMessages]);

  const handleTypingStart = () => {
    if (!chatRoomId || !session?.user?.id) return;
    const socket = getSocket();
    if (!socket.connected) return;
    socket.emit("chat:typing:start", {
      chatRoomId,
      userId: Number(session.user.id),
      userName: session.user.name || null,
    });
  };

  const handleTypingStop = () => {
    if (!chatRoomId || !session?.user?.id) return;
    const socket = getSocket();
    if (!socket.connected) return;
    socket.emit("chat:typing:stop", {
      chatRoomId,
      userId: Number(session.user.id),
    });
  };

  const typingEntries = Object.values(typingUsers).filter(Boolean) as string[];
  const typingText =
    typingEntries.length === 0
      ? null
      : typingEntries.length === 1
        ? `${typingEntries[0]} is typing...`
        : `${typingEntries[0]} and ${typingEntries.length - 1} other${typingEntries.length > 2 ? "s" : ""} are typing...`;

  const presenceText =
    !chatRoom?.isGroup && chatRoom?.otherUser?.id
      ? isUserOnline(chatRoom.otherUser.id)
        ? "Online"
        : "Offline"
      : null;

  const handleSendMessage = async (
    content: string,
    type: "TEXT" | "LINK" | "IMAGE" | "FILE",
    file?: File,
  ) => {
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
      const payload: any = {
        messageType: messageToForward.messageType,
      };

      if (
        messageToForward.messageType === "IMAGE" ||
        messageToForward.messageType === "FILE"
      ) {
        const mediaResponse = await fetch(messageToForward.message);
        if (!mediaResponse.ok) {
          throw new Error("Failed to load media for forwarding");
        }

        const blob = await mediaResponse.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        payload.file = {
          buffer: base64.split(",")[1],
          type:
            blob.type ||
            (messageToForward.messageType === "IMAGE"
              ? "image/png"
              : "application/octet-stream"),
        };
      } else {
        payload.content = messageToForward.message;
      }

      await axios.post(`/api/chat/messages/send/${targetChatId}`, payload);
      toast.success("Message forwarded");
      setForwardModalOpen(false);
      setMessageToForward(null);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to forward message",
      );
    }
  };

  const handleOpenChatSettings = () => {
    router.push(`/chat/${chatRoomId}/settings`);
  };

  const handleRequestLeaveOrDelete = () => {
    setShowChatActionDialog(true);
  };

  const handleLeaveOrDeleteChat = async () => {
    if (!chatRoomId || isChatActionLoading) return;

    setIsChatActionLoading(true);
    try {
      const response = await axios.delete(`/api/chat/delete/${chatRoomId}`);
      if (response.data.success) {
        toast.success(response.data.message || "Chat updated successfully");
        router.push("/chat");
      } else {
        toast.error(response.data.message || "Failed to update chat");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update chat");
    } finally {
      setIsChatActionLoading(false);
      setShowChatActionDialog(false);
    }
  };

  const leaveOrDeleteLabel = chatRoom?.isGroup
    ? chatRoom.isAdmin
      ? "Delete group"
      : "Leave group"
    : "Leave chat";

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
    <div
      className="fixed inset-0 flex flex-col overflow-hidden bg-[#18181b]"
      style={{ top: "88px", left: "256px", right: 0, bottom: 0 }}
    >
      <div className="flex-shrink-0 border-b border-zinc-800 z-10">
        <ChatHeader
          chatRoom={chatRoom}
          isLoading={isLoadingRoom}
          onRefresh={handleRefresh}
          typingText={typingText}
          presenceText={presenceText}
          lastSeenAt={!chatRoom?.isGroup ? chatRoom?.otherUser?.lastSeenAt : undefined}
          onOpenSettings={handleOpenChatSettings}
          onRequestLeaveOrDelete={handleRequestLeaveOrDelete}
          leaveOrDeleteLabel={leaveOrDeleteLabel}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isGroupChat={chatRoom?.isGroup || false}
          unreadInfo={unreadInfo}
          hasMore={hasMore}
          isLoading={isLoadingMessages}
          onLoadMore={loadMore}
          seenMap={seenMap}
          onGetSeenUsers={getSeenUsers}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onForwardMessage={handleForwardMessage}
        />
      </div>

      <div className="flex-shrink-0 border-t border-zinc-800 bg-[#18181b]">
        <MessageInput
          onSendMessage={handleSendMessage}
          isSending={isSending}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
        />
      </div>

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

      <AlertDialog
        open={showChatActionDialog}
        onOpenChange={setShowChatActionDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {chatRoom?.isGroup && chatRoom.isAdmin
                ? "Delete group?"
                : "Leave chat?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {chatRoom?.isGroup && chatRoom.isAdmin
                ? "This will permanently delete the group, its messages, and all participant access."
                : "This will remove you from the chat. You can return only if someone creates or invites you again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isChatActionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveOrDeleteChat}
              disabled={isChatActionLoading}
            >
              {isChatActionLoading ? "Working..." : leaveOrDeleteLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
