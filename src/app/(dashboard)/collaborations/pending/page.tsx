"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
import { useAllUsers } from "@/hooks/useAllUsers";
import { useProjectCollaborators } from "@/hooks/useProjectCollaborators";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";

function ProjectTeamManager({ project, currentUserId, users }: any) {
  const { collaborators, isLoading, mutate } = useProjectCollaborators(project.id);
  const [selectedUser, setSelectedUser] = useState("");
  const [accessLevel, setAccessLevel] = useState("LIMITED");
  const [isInviting, setIsInviting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const accepted = collaborators.filter((c: any) => c.status === "ACCEPTED");
  const pendingInvites = collaborators.filter(
    (c: any) => c.status === "PENDING" && c.inviter
  );

  const handleInvite = async () => {
    if (!selectedUser) return;
    setIsInviting(true);
    try {
      const res = await axios.post(`/api/project/invite-collab/${project.id}`, {
        userId: Number(selectedUser),
        giveAccess: accessLevel,
      });
      if (res.data.success) {
        toast.success("Invite sent successfully");
        setSelectedUser("");
        mutate();
      } else {
        toast.error(res.data.message || "Failed to invite user");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to invite user");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (userId: number) => {
    setRemovingId(userId);
    try {
      const res = await axios.delete(`/api/project/remove-collab/${project.id}`, {
        data: { userId },
      });
      if (res.data.success) {
        toast.success("Collaborator removed");
        mutate();
      } else {
        toast.error(res.data.message || "Failed to remove collaborator");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove collaborator");
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) return <LoadingSkeleton type="list" />;

  return (
    <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">{project.title}</h3>
        <p className="text-xs text-[#A1A1AA]">{accepted.length} members</p>
      </div>

      <div className="bg-[#18181b] rounded-lg p-3">
        <p className="text-sm text-white font-semibold mb-2">Invite Collaborator</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users
                .filter((u: any) => u.id !== currentUserId)
                .map((u: any) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name} (@{u.username})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select value={accessLevel} onValueChange={setAccessLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Access" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LIMITED">Limited</SelectItem>
              <SelectItem value="FULL">Full</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleInvite} disabled={!selectedUser || isInviting}>
            {isInviting ? "Inviting..." : "Send Invite"}
          </Button>
        </div>
      </div>

      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[#A1A1AA]">Pending invites</p>
          {pendingInvites.map((invite: any) => (
            <div
              key={invite.id}
              className="flex items-center justify-between bg-[#18181b] rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={invite.user?.image || "/default-avatar.png"}
                  alt={invite.user?.name}
                  className="h-8 w-8 rounded-full border border-zinc-700 object-cover"
                />
                <div>
                  <p className="text-sm text-white font-semibold">{invite.user?.name}</p>
                  <p className="text-xs text-[#A1A1AA]">@{invite.user?.username}</p>
                </div>
              </div>
              <p className="text-xs text-[#A1A1AA]">Awaiting response</p>
            </div>
          ))}
        </div>
      )}

      {accepted.length === 0 ? (
        <p className="text-xs text-[#A1A1AA]">No collaborators yet.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-[#A1A1AA]">Active members</p>
          {accepted.map((collab: any) => (
            <div
              key={collab.id}
              className="flex items-center justify-between bg-[#18181b] rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={collab.user?.image || "/default-avatar.png"}
                  alt={collab.user?.name}
                  className="h-8 w-8 rounded-full border border-zinc-700 object-cover"
                />
                <div>
                  <p className="text-sm text-white font-semibold">{collab.user?.name}</p>
                  <p className="text-xs text-[#A1A1AA]">@{collab.user?.username}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRemove(collab.user?.id)}
                disabled={removingId === collab.user?.id}
              >
                {removingId === collab.user?.id ? "Removing..." : "Remove"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CollaborationPendingPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const currentUserId = Number(session?.user?.id || 0);
  const { projects, isLoading } = useProjects();
  const { users, isLoading: usersLoading } = useAllUsers();
  const [selectedProjectId, setSelectedProjectId] = useState("");

  useEffect(() => {
    const paramId = searchParams.get("projectId") || "";
    if (paramId) setSelectedProjectId(paramId);
  }, [searchParams]);

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((p: any) => String(p.id) === String(selectedProjectId));
  }, [projects, selectedProjectId]);

  if (isLoading || usersLoading) return <LoadingSkeleton type="detail" />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Team Management</h1>
        <p className="text-[#A1A1AA] text-sm">Select a project to invite or remove collaborators</p>
      </div>

      {projects.length > 0 && (
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
          <p className="text-sm text-white font-semibold mb-2">Choose Project</p>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project: any) => (
                <SelectItem key={project.id} value={String(project.id)}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No owned projects"
          description="Create a project to manage team members."
        />
      ) : selectedProject ? (
        <ProjectTeamManager
          project={selectedProject}
          currentUserId={currentUserId}
          users={users}
        />
      ) : (
        <EmptyState
          icon={Users}
          title="Select a project"
          description="Pick a project above to manage its team."
        />
      )}
    </div>
  );
}
