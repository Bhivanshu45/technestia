"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useProjects } from "@/hooks/useProjects";
import { useProjectCollaborators } from "@/hooks/useProjectCollaborators";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

function ProjectRequestsPanel({
  project,
  onHasRequests,
}: {
  project: any;
  onHasRequests: () => void;
}) {
  const { collaborators, isLoading, mutate } = useProjectCollaborators(project.id);

  const requests = collaborators.filter(
    (c: any) => c.status === "PENDING" && !c.inviter
  );

  useEffect(() => {
    if (requests.length > 0) onHasRequests();
  }, [requests.length, onHasRequests]);

  const handleAccept = async (collabId: number) => {
    try {
      const res = await axios.patch(`/api/project/accept-collab/${project.id}`, {
        targetCollabId: collabId,
      });
      if (res.data.success) {
        toast.success("Request accepted");
        mutate();
      } else {
        toast.error(res.data.message || "Failed to accept request");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to accept request");
    }
  };

  const handleReject = async (collabId: number) => {
    try {
      const res = await axios.patch(`/api/project/reject-collab/${project.id}`, {
        targetCollabId: collabId,
      });
      if (res.data.success) {
        toast.success("Request rejected");
        mutate();
      } else {
        toast.error(res.data.message || "Failed to reject request");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject request");
    }
  };

  if (isLoading) {
    return <LoadingSkeleton type="list" />;
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">{project.title}</h3>
        <p className="text-xs text-[#A1A1AA]">{requests.length} pending</p>
      </div>
      {requests.map((req: any) => (
        <div key={req.id} className="flex items-center justify-between bg-[#18181b] rounded-lg p-3">
          <div className="flex items-center gap-3">
            <img
              src={req.user?.image || "/default-avatar.png"}
              alt={req.user?.name}
              className="h-8 w-8 rounded-full border border-zinc-700 object-cover"
            />
            <div>
              <p className="text-sm text-white font-semibold">{req.user?.name || "Unknown"}</p>
              <p className="text-xs text-[#A1A1AA]">@{req.user?.username || "unknown"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleAccept(req.id)}>
              Accept
            </Button>
            <Button
              size="sm"
              onClick={() => handleReject(req.id)}
              className="bg-zinc-200 text-black hover:bg-zinc-300"
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CollaborationRequestsPage() {
  const { projects, isLoading } = useProjects();
  const [hasRequests, setHasRequests] = useState(false);

  if (isLoading) return <LoadingSkeleton type="detail" />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Collaboration Requests</h1>
        <p className="text-[#A1A1AA] text-sm">Approve or reject incoming requests</p>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No projects found"
          description="Create a project to receive collaboration requests."
        />
      ) : (
        <>
          <div className="space-y-4">
            {projects.map((project: any) => (
              <ProjectRequestsPanel
                key={project.id}
                project={project}
                onHasRequests={() => setHasRequests(true)}
              />
            ))}
          </div>
          {!hasRequests && (
            <EmptyState
              icon={Users}
              title="No pending requests"
              description="You don't have any collaboration requests right now."
            />
          )}
        </>
      )}
    </div>
  );
}
