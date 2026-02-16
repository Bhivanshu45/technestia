"use client";

import React, { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { useCollaboratedProjects } from "@/hooks/useProjects";
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

export default function CollaborationHistoryPage() {
  const { projects, isLoading, mutate } = useCollaboratedProjects();
  const [leavingId, setLeavingId] = useState<number | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<number | null>(null);

  const handleLeave = async (projectId: number) => {
    setLeavingId(projectId);
    try {
      const res = await axios.delete(`/api/project/leave-collab/${projectId}`);
      if (res.data.success) {
        toast.success("Left project successfully");
        mutate();
      } else {
        toast.error(res.data.message || "Failed to leave project");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to leave project");
    } finally {
      setLeavingId(null);
    }
  };

  if (isLoading) return <LoadingSkeleton type="detail" />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Collaboration History</h1>
        <p className="text-[#A1A1AA] text-sm">Projects you are currently collaborating on</p>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No collaboration history"
          description="You are not collaborating on any project yet."
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
                <Button
                  size="sm"
                  onClick={() => setLeaveTarget(project.id)}
                  disabled={leavingId === project.id}
                  className="bg-[#1f1f23] text-white border border-zinc-700 hover:bg-[#2a2a2f]"
                >
                  {leavingId === project.id ? "Leaving..." : "Leave"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

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
