"use client";

import React, { useState } from "react";
import { useMilestones } from "@/hooks/useMilestones";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { Plus, Calendar, CheckCircle, AlertCircle } from "lucide-react";

export default function ProjectMilestonesTab({ projectId, isOwner }: any) {
  const { milestones, isLoading } = useMilestones(projectId);
  const [statusFilter, setStatusFilter] = useState("all");

  if (isLoading) return <LoadingSkeleton type="list" />;

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
