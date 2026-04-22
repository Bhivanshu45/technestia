"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useSWRConfig } from "swr";
import { getSocket } from "@/socket";

interface CollabSyncPayload {
  type:
    | "REQUEST_SENT"
    | "INVITE_SENT"
    | "REQUEST_ACCEPTED"
    | "REQUEST_REJECTED"
    | "INVITE_ACCEPTED"
    | "INVITE_DECLINED"
    | "INVITE_CANCELLED";
  projectId: number;
  collaborationId: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  actorUserId: number;
  targetUserId: number;
  invitedBy: number | null;
  updatedAt: string;
}

function GlobalRealtimeSync() {
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = Number(session.user.id);
    if (!Number.isFinite(userId) || userId <= 0) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const handleCollabSync = (payload: CollabSyncPayload) => {
      mutate("/api/project/invites/my");
      mutate("/api/project/requests/my");
      mutate("/api/project/user-projects/owned");
      mutate("/api/project/user-projects/collaborated");

      if (payload?.projectId) {
        mutate(`/api/project/collaborators/${payload.projectId}`);
        mutate(`/api/project/details/${payload.projectId}`);
        mutate(`/api/project/public-details/${payload.projectId}`);
      }
    };

    socket.emit("joinUser", { userId });
    socket.on("collab:sync", handleCollabSync);

    return () => {
      socket.emit("leaveUser", { userId });
      socket.off("collab:sync", handleCollabSync);
    };
  }, [session?.user?.id, mutate]);

  return null;
}

export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <GlobalRealtimeSync />
      {children}
    </SessionProvider>
  );
}
