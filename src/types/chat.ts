export interface ChatRoom {
  id: number;
  name: string | null;
  image: string | null;
  isGroup: boolean;
  latestMessage: string | null;
  latestMessageSender: string | null;
  latestMessageAt: Date | null;
  unreadCount: number;
}

export interface ChatRoomDetails {
  id: number;
  isGroup: boolean;
  name?: string | null;
  image?: string | null;
  totalParticipants?: number;
  isAdmin?: boolean;
  projectId?: number | null;
  otherUser?: {
    id: number;
    name: string | null;
    image: string | null;
  };
}

export interface ChatMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  message: string;
  messageType: "TEXT" | "IMAGE" | "FILE" | "LINK";
  cloudinaryPublicId: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date | string;
  sender: {
    id: number;
    name: string | null;
    image: string | null;
  };
  sending?: boolean; // For optimistic updates
}

export interface ChatParticipant {
  id: number;
  chatRoomId: number;
  userId: number;
  isAdmin: boolean;
  joinedAt: Date;
  hasLeft: boolean;
  lastSeenAt: Date | null;
  user: {
    id: number;
    name: string | null;
    username: string | null;
    image: string | null;
    email: string | null;
  };
}

export interface SendMessageData {
  messageType: "TEXT" | "LINK" | "IMAGE" | "FILE";
  content?: string;
  file?: {
    buffer: string;
    type: string;
  };
}

export interface MessagesResponse {
  success: boolean;
  messages: ChatMessage[];
  nextCursor: string | null;
  unreadInfo: {
    unreadCount: number;
    firstUnreadMessageId: number | null;
  };
}
