"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useProjects } from "@/hooks/useProjects";
import { useProjectCollaborators } from "@/hooks/useProjectCollaborators";
import { useMyInvites } from "@/hooks/useMyInvites";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Users } from "lucide-react";

function ProjectInvitesPanel({
  project,
  currentUserId,
  onHasInvites,
  onCancelInvite,
}: {
  project: any;
  currentUserId: number;
  onHasInvites: () => void;
  onCancelInvite: (projectId: number, collabId: number) => void;
}) {
  const { collaborators, isLoading } = useProjectCollaborators(project.id);

  const pendingInvites = useMemo(
    () =>
      collaborators.filter(
        (c: any) => c.status === "PENDING" && c.inviter?.id === currentUserId
      ),
    [collaborators, currentUserId]
  );

  useEffect(() => {
    if (pendingInvites.length > 0) onHasInvites();
  }, [pendingInvites.length, onHasInvites]);

  if (isLoading || pendingInvites.length === 0) return null;

  return (
    <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">{project.title}</h3>
        <p className="text-xs text-[#A1A1AA]">{pendingInvites.length} pending</p>
      </div>
      {pendingInvites.map((invite: any) => (
        <div key={invite.id} className="flex items-center justify-between bg-[#18181b] rounded-lg p-3">
          <div className="flex items-center gap-3">
            <img
              src={invite.user?.image || "/default-avatar.png"}
              alt={invite.user?.name}
              className="h-8 w-8 rounded-full border border-zinc-700 object-cover"
            />
            <div>
              <p className="text-sm text-white font-semibold">{invite.user?.name || "Unknown"}</p>
              <p className="text-xs text-[#A1A1AA]">@{invite.user?.username || "unknown"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-[#A1A1AA]">Awaiting response</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancelInvite(project.id, invite.id)}
              className="bg-[#1f1f23] text-white border border-zinc-700 hover:bg-[#2a2a2f]"
            >
              Cancel
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CollaborationInvitationsPage() {
  const { data: session } = useSession();
  const currentUserId = Number(session?.user?.id || 0);
  const { projects, isLoading } = useProjects();
  const { invites, isLoading: invitesLoading, mutate: mutateInvites } = useMyInvites();
  const [isJoining, setIsJoining] = useState<number | null>(null);
  const [isDeclining, setIsDeclining] = useState<number | null>(null);
  const [hasInvites, setHasInvites] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{ projectId: number; collabId: number } | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const handleAcceptInvite = async (projectId: number) => {
    setIsJoining(projectId);
    try {
      const res = await axios.patch(`/api/project/join-invite/${projectId}`);
      if (res.data.success) {
        toast.success("Joined project successfully");
        mutateInvites();
      } else {
        toast.error(res.data.message || "Failed to join project");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to join project");
    } finally {
      setIsJoining(null);
    }
  };

  const handleDeclineInvite = async (projectId: number) => {
    setIsDeclining(projectId);
    try {
      const res = await axios.patch(`/api/project/decline-invite/${projectId}`);
      if (res.data.success) {
        toast.success("Invite declined");
        mutateInvites();
      } else {
        toast.error(res.data.message || "Failed to decline invite");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to decline invite");
    } finally {
      setIsDeclining(null);
    }
  };

  const handleCancelInvite = async (projectId: number, collabId: number) => {
    setIsCanceling(true);
    try {
      const res = await axios.patch(`/api/project/cancel-invite/${projectId}`, {
        targetCollabId: collabId,
      });
      if (res.data.success) {
        toast.success("Invite canceled");
      } else {
        toast.error(res.data.message || "Failed to cancel invite");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel invite");
    } finally {
      setIsCanceling(false);
      setCancelTarget(null);
    }
  };

  if (isLoading || invitesLoading) return <LoadingSkeleton type="detail" />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Invitations</h1>
        <p className="text-[#A1A1AA] text-sm">Manage incoming invites and track sent invites</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Incoming Invites</h2>
        {invites.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No invites"
            description="You don't have any collaboration invites right now."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {invites.map((invite: any) => (
              <div key={invite.id} className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-1">{invite.project.title}</h3>
                <p className="text-sm text-[#A1A1AA] line-clamp-2 mb-3">
                  {invite.project.description}
                </p>
                <p className="text-xs text-[#A1A1AA] mb-3">
                  Invited by {invite.inviter?.name || "Unknown"}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptInvite(invite.project.id)}
                    disabled={isJoining === invite.project.id}
                  >
                    {isJoining === invite.project.id ? "Joining..." : "Accept"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeclineInvite(invite.project.id)}
                    disabled={isDeclining === invite.project.id}
                    className="bg-[#1f1f23] text-white border border-zinc-700 hover:bg-[#2a2a2f]"
                  >
                    {isDeclining === invite.project.id ? "Declining..." : "Decline"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Sent Invites</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-[#A1A1AA]">
            Create a project to send collaboration invites.
          </p>
        ) : (
          <>
            <div className="space-y-4">
              {projects.map((project: any) => (
                <ProjectInvitesPanel
                  key={project.id}
                  project={project}
                  currentUserId={currentUserId}
                  onHasInvites={() => setHasInvites(true)}
                  onCancelInvite={(projectId, collabId) =>
                    setCancelTarget({ projectId, collabId })
                  }
                />
              ))}
            </div>
            {!hasInvites && (
              <p className="text-sm text-[#A1A1AA]">
                You haven't sent any collaboration invites yet.
              </p>
            )}
          </>
        )}
      </div>

      <AlertDialog open={cancelTarget !== null}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-lg font-semibold">
            Cancel this invite?
          </AlertDialogHeader>
          <p className="text-sm text-[#A1A1AA]">
            The invited user will no longer be able to join this project.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancelTarget) {
                  handleCancelInvite(cancelTarget.projectId, cancelTarget.collabId);
                }
              }}
              disabled={isCanceling}
            >
              {isCanceling ? "Canceling..." : "Yes, Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
