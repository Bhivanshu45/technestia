"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { useProjects, useCollaboratedProjects } from "@/hooks/useProjects";
import { useMyInvites } from "@/hooks/useMyInvites";
import { useMyRequests } from "@/hooks/useMyRequests";
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

export default function CollaborationsOverviewPage() {
  const { projects, isLoading: loadingOwned, mutate: mutateOwned } = useProjects();
  const {
    projects: collaboratedProjects,
    isLoading: loadingCollab,
    mutate: mutateCollab,
  } = useCollaboratedProjects();
  const { invites } = useMyInvites();
  const { requests } = useMyRequests();
  const [isLeaving, setIsLeaving] = useState<number | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<number | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingRequestsLoading, setPendingRequestsLoading] = useState(false);

  const handleLeave = async (projectId: number) => {
    setIsLeaving(projectId);
    try {
      const res = await axios.delete(`/api/project/leave-collab/${projectId}`);
      if (res.data.success) {
        toast.success("You left the project successfully");
        mutateCollab();
      } else {
        toast.error(res.data.message || "Failed to leave project");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to leave project");
    } finally {
      setIsLeaving(null);
    }
  };

  useEffect(() => {
    const fetchPendingCounts = async () => {
      if (!projects.length) {
        setPendingRequestsCount(0);
        return;
      }
      setPendingRequestsLoading(true);
      try {
        const results = await Promise.all(
          projects.map((project: any) =>
            axios.get(`/api/project/collaborators/${project.id}`)
          )
        );
        const total = results.reduce((sum, res) => {
          const items = res.data?.collaborators || [];
          const pending = items.filter(
            (c: any) => c.status === "PENDING" && !c.inviter
          ).length;
          return sum + pending;
        }, 0);
        setPendingRequestsCount(total);
      } catch {
        setPendingRequestsCount(0);
      } finally {
        setPendingRequestsLoading(false);
      }
    };

    fetchPendingCounts();
  }, [projects]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Collaborations</h1>
          <p className="text-[#A1A1AA] text-sm">Manage your teams and collaboration projects</p>
        </div>
        <Link href="/collaborations/join">
          <Button className="bg-blue-700 hover:bg-blue-800 text-white">Join Project</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-[#A1A1AA]">Owned Projects</p>
          <p className="text-2xl font-bold text-white">{projects.length}</p>
        </div>
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-[#A1A1AA]">Collaborations</p>
          <p className="text-2xl font-bold text-white">{collaboratedProjects.length}</p>
        </div>
      </div>

      <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Action Center</h2>
          <p className="text-xs text-[#A1A1AA]">
            Quickly handle invites, requests, and team actions.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-[#A1A1AA]">Incoming Invites</p>
            <p className="text-2xl font-bold text-white">{invites.length}</p>
            <Link href="/collaborations/invitations">
              <Button size="sm" className="mt-3 w-full bg-blue-700 hover:bg-blue-800 text-white">
                View Invites
              </Button>
            </Link>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-[#A1A1AA]">Incoming Requests</p>
            <p className="text-2xl font-bold text-white">
              {pendingRequestsLoading ? "…" : pendingRequestsCount}
            </p>
            <Link href="/collaborations/requests">
              <Button size="sm" className="mt-3 w-full bg-blue-700 hover:bg-blue-800 text-white">
                Review Requests
              </Button>
            </Link>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-[#A1A1AA]">My Requests</p>
            <p className="text-2xl font-bold text-white">{requests.length}</p>
            <Link href="/collaborations/my-requests">
              <Button size="sm" className="mt-3 w-full bg-blue-700 hover:bg-blue-800 text-white">
                Track Requests
              </Button>
            </Link>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-[#A1A1AA]">Join a Project</p>
            <p className="text-2xl font-bold text-white">Browse</p>
            <Link href="/collaborations/join">
              <Button size="sm" className="mt-3 w-full bg-blue-700 hover:bg-blue-800 text-white">
                Find Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>


      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">My Projects</h2>
        {loadingOwned ? (
          <LoadingSkeleton type="card" count={4} />
        ) : projects.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No projects yet"
            description="Create a project to start collaborating."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project: any) => (
              <div key={project.id} className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-1">{project.title}</h3>
                <p className="text-sm text-[#A1A1AA] line-clamp-2 mb-3">{project.description}</p>
                <div className="flex gap-2">
                  <Link href={`/projects/${project.id}`}>
                    <Button size="sm">Open</Button>
                  </Link>
                  <Link href={`/collaborations/pending?projectId=${project.id}`}>
                    <Button size="sm" variant="secondary">
                      Manage Team
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Collaborated Projects</h2>
        {loadingCollab ? (
          <LoadingSkeleton type="card" count={4} />
        ) : collaboratedProjects.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No collaborations yet"
            description="Join or accept invitations to collaborate on projects."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {collaboratedProjects.map((project: any) => (
              <div key={project.id} className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-1">{project.title}</h3>
                <p className="text-sm text-[#A1A1AA] line-clamp-2 mb-3">{project.description}</p>
                <div className="flex gap-2">
                  <Link href={`/projects/${project.id}`}>
                    <Button size="sm">Open</Button>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => setLeaveTarget(project.id)}
                    disabled={isLeaving === project.id}
                    className="bg-[#1f1f23] text-white border border-zinc-700 hover:bg-[#2a2a2f]"
                  >
                    {isLeaving === project.id ? "Leaving..." : "Leave"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={leaveTarget !== null}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-lg font-semibold">
            Leave this project?
          </AlertDialogHeader>
          <p className="text-sm text-[#A1A1AA]">
            You will lose access to this project until you are invited again.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLeaveTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (leaveTarget) handleLeave(leaveTarget);
                setLeaveTarget(null);
              }}
            >
              Yes, Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
