export type NotificationKind =
  | "COLLABORATION_REQUEST"
  | "COLLABORATION_APPROVED"
  | "MILESTONE_APPROVED"
  | "MILESTONE_REJECTED"
  | "NEW_FEEDBACK"
  | "FEEDBACK_REACTION"
  | "GENERAL";

export interface NotificationItem {
  id: number;
  userId: number;
  type: NotificationKind;
  message: string;
  isRead: boolean;
  targetId: number | null;
  targetType: string | null;
  createdAt: string;
}
