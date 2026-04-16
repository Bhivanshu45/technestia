"use client";

import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useMilestones } from "@/hooks/useMilestones";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { Plus, Calendar, CheckCircle, AlertCircle } from "lucide-react";

export default function ProjectMilestonesTab({ projectId, isOwner, canApproveUpdateRequests = false }: any) {
  const { milestones, isLoading, mutate } = useMilestones(projectId);
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvingId, setApprovingId] = useState<number | null>(null);

  if (isLoading) return <LoadingSkeleton type="list" />;

  const pendingRequests = (milestones || []).filter(
    (milestone: any) => milestone.updateRequest === "PENDING"
  );

  const handleApproval = async (milestoneId: number, updateRequest: "APPROVED" | "REJECTED") => {
    if (approvingId) return;
    setApprovingId(milestoneId);

    try {
      const res = await axios.put(
        `/api/project/milestones/approve-updateRequest/${milestoneId}`,
        { updateRequest }
      );

      if (res.data.success) {
        toast.success(updateRequest === "APPROVED" ? "Request approved" : "Request rejected");
        await mutate();
      } else {
        toast.error(res.data.message || "Failed to process update request");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to process update request");
    } finally {
      setApprovingId(null);
    }
  };

  const filtered =
    milestones?.filter((m: any) => {
      const status = m.completionStatus || m.status;
      return statusFilter === "all" ? true : status === statusFilter;
    }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-900 text-green-200";
      case "IN_PROGRESS":
        return "bg-blue-900 text-blue-200";
      case "NOT_STARTED":
        return "bg-yellow-900 text-yellow-200";
      case "SKIPPED":
        return "bg-gray-600 text-gray-200";
      default:
        return "bg-gray-700 text-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "Not Started";
      case "IN_PROGRESS":
        return "In Progress";
      case "COMPLETED":
        return "Completed";
      case "SKIPPED":
        return "Skipped";
      default:
        return status.replace(/_/g, " ");
    }
  };

  return (
    <div className="space-y-6">
      {canApproveUpdateRequests && (
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Pending Update Requests</h3>
            <Badge className="bg-yellow-900 text-yellow-200">
              {pendingRequests.length}
            </Badge>
          </div>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-zinc-400">No pending milestone update requests.</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((milestone: any) => (
                <div key={milestone.id} className="bg-[#18181b] border border-zinc-800 rounded-lg p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-white font-semibold">{milestone.title}</p>
                      <p className="text-xs text-zinc-400">{milestone.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproval(milestone.id, "APPROVED")}
                        disabled={approvingId === milestone.id}
                      >
                        {approvingId === milestone.id ? "Working..." : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-zinc-700"
                        onClick={() => handleApproval(milestone.id, "REJECTED")}
                        disabled={approvingId === milestone.id}
                      >
                        {approvingId === milestone.id ? "Working..." : "Reject"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters and Add Button */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#232326] border border-zinc-800 rounded-lg p-4">
        <div className="flex gap-2">
          {["all", "NOT_STARTED", "IN_PROGRESS", "COMPLETED", "SKIPPED"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={`capitalize ${
                statusFilter === status
                  ? "bg-blue-700 text-white border-blue-700"
                  : "bg-[#1f1f23] text-white border border-zinc-700 hover:bg-[#2a2a2f]"
              }`}
            >
              {status === "IN_PROGRESS"
                ? "In Progress"
                : status === "NOT_STARTED"
                ? "Not Started"
                : status === "SKIPPED"
                ? "Skipped"
                : status}
            </Button>
          ))}
        </div>
        {isOwner && (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Milestone
          </Button>
        )}
      </div>

      {/* Milestones List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No milestones"
          description={
            statusFilter === "all"
              ? "Start by creating your first milestone"
              : `No ${statusFilter.replace(/_/g, " ")} milestones yet`
          }
          actionLabel={isOwner ? "Create Milestone" : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((milestone: any) => (
            <div
              key={milestone.id}
              className="bg-[#232326] border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">
                      {milestone.title}
                    </h3>
                    <Badge
                      className={getStatusColor(
                        milestone.completionStatus || milestone.status
                      )}
                    >
                      {getStatusLabel(
                        milestone.completionStatus || milestone.status
                      )}
                    </Badge>
                    {milestone.updateRequest === "PENDING" && (
                      <Badge className="bg-yellow-900 text-yellow-200">Pending Approval</Badge>
                    )}
                  </div>
                  <p className="text-[#A1A1AA] mb-3">
                    {milestone.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                    <Calendar className="h-4 w-4" />
                    {new Date(milestone.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {milestone.completionStatus === "COMPLETED" && (
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
