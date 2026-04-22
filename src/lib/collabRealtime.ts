export type CollabSyncType =
  | "REQUEST_SENT"
  | "INVITE_SENT"
  | "REQUEST_ACCEPTED"
  | "REQUEST_REJECTED"
  | "INVITE_ACCEPTED"
  | "INVITE_DECLINED"
  | "INVITE_CANCELLED";

export interface CollabSyncPayload {
  type: CollabSyncType;
  projectId: number;
  collaborationId: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  actorUserId: number;
  targetUserId: number;
  invitedBy: number | null;
  updatedAt: string;
}

export function emitCollabSyncToUsers(userIds: number[], payload: CollabSyncPayload) {
  const io = (globalThis as any).__io;
  if (!io) return;

  const normalizedIds = Array.from(
    new Set(
      userIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  );

  for (const userId of normalizedIds) {
    io.to("user:" + userId).emit("collab:sync", payload);
  }
}
