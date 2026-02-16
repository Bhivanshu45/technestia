"use client";

import React from "react";
import { useActivityLog } from "@/hooks/useActivityLog";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Activity, Plus, Edit, Users, FileText, CheckCircle } from "lucide-react";

export default function ProjectActivityTab({ projectId }: any) {
  const { activityLogs, isLoading } = useActivityLog(projectId);

  if (isLoading) return <LoadingSkeleton type="list" />;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "POST_PROJECT":
        return <Plus className="h-4 w-4" />;
      case "UPDATE_PROJECT":
        return <Edit className="h-4 w-4" />;
      case "REQUEST_COLLABORATION":
      case "APPROVE_COLLABORATION":
      case "REJECT_COLLABORATION":
        return <Users className="h-4 w-4" />;
      case "CREATE_MILESTONE":
      case "UPDATE_MILESTONE":
      case "DELETE_MILESTONE":
        return <CheckCircle className="h-4 w-4" />;
      case "CREATE_FEEDBACK":
      case "REACT_FEEDBACK":
        return <FileText className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string | undefined) => {
    if (!type) return "bg-gray-700 text-gray-200";
    if (type.includes("POST") || type.includes("CREATE")) return "bg-green-900 text-green-200";
    if (type.includes("UPDATE")) return "bg-blue-900 text-blue-200";
    if (type.includes("DELETE") || type.includes("REMOVE")) return "bg-red-900 text-red-200";
    if (type.includes("REQUEST") || type.includes("APPROVE") || type.includes("REJECT")) {
      return "bg-purple-900 text-purple-200";
    }
    return "bg-gray-700 text-gray-200";
  };

  const getActivityLabel = (type: string | undefined) => {
    if (!type) return "unknown activity";
    return type.replace(/_/g, " ").toLowerCase();
  };

  return (
    <div className="space-y-6">
      {activityLogs && activityLogs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activities yet"
          description="Project activities will appear here"
        />
      ) : (
        <div className="space-y-4">
          {activityLogs?.map((activity: any, idx: number) => {
            const actionType = activity.actionType || activity.activityType;
            return (
            <div
              key={activity.id || idx}
              className="bg-[#232326] border border-zinc-800 rounded-lg p-4"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-white">
                    {getActivityIcon(actionType)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold">
                      {activity.user?.name || "Unknown User"}
                    </p>
                    <p className="text-[#A1A1AA]">{activity.description}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getActivityColor(actionType)}>
                      {getActivityLabel(actionType)}
                    </Badge>
                    <p className="text-xs text-[#A1A1AA]">
                      {new Date(activity.createdAt).toLocaleDateString()} at{" "}
                      {new Date(activity.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
