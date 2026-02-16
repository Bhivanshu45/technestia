"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import {
  Activity,
  CheckCircle,
  Edit,
  FileText,
  Plus,
  Users,
} from "lucide-react";
import { ActivityLog, ActivityType } from "@/types/activity";

export interface ActivityFeedItem extends ActivityLog {
  projectTitle?: string;
}

type GroupedItems = {
  label: string;
  items: ActivityFeedItem[];
};

const getActivityIcon = (type: ActivityType | string | undefined) => {
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

const getActivityColor = (type: ActivityType | string | undefined) => {
  if (!type) return "bg-gray-700 text-gray-200";
  if (type.includes("POST") || type.includes("CREATE")) {
    return "bg-green-900 text-green-200";
  }
  if (type.includes("UPDATE")) {
    return "bg-blue-900 text-blue-200";
  }
  if (type.includes("DELETE") || type.includes("REMOVE")) {
    return "bg-red-900 text-red-200";
  }
  if (type.includes("REQUEST") || type.includes("APPROVE") || type.includes("REJECT")) {
    return "bg-purple-900 text-purple-200";
  }
  return "bg-gray-700 text-gray-200";
};

const getActivityLabel = (type: ActivityType | string | undefined) => {
  if (!type) return "unknown activity";
  return type.replace(/_/g, " ").toLowerCase();
};

const formatRelativeTime = (dateValue: string | Date) => {
  const now = new Date();
  const date = new Date(dateValue);
  const diffMs = now.getTime() - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const groupByDate = (items: ActivityFeedItem[]): GroupedItems[] => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const groups: GroupedItems[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "This Week", items: [] },
    { label: "Older", items: [] },
  ];

  items.forEach((item) => {
    const date = new Date(item.createdAt);
    if (date >= startOfToday) groups[0].items.push(item);
    else if (date >= startOfYesterday) groups[1].items.push(item);
    else if (date >= startOfWeek) groups[2].items.push(item);
    else groups[3].items.push(item);
  });

  return groups.filter((group) => group.items.length > 0);
};

export default function ActivityTimeline({
  items,
  isLoading,
  currentUserId,
}: {
  items: ActivityFeedItem[];
  isLoading?: boolean;
  currentUserId?: number;
}) {
  if (isLoading) return <LoadingSkeleton type="list" />;

  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No activities yet"
        description="Your activity timeline will appear here."
      />
    );
  }

  const grouped = useMemo(() => groupByDate(items), [items]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const getTargetLink = (activity: ActivityFeedItem) => {
    if (!activity.projectId) return null;
    if (activity.targetType === "Milestone") {
      return `/projects/${activity.projectId}?tab=milestones`;
    }
    if (activity.targetType === "Feedback") {
      return `/projects/${activity.projectId}?tab=feedbacks`;
    }
    if (activity.targetType === "Activity") {
      return `/projects/${activity.projectId}?tab=activity`;
    }
    return `/projects/${activity.projectId}`;
  };

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.label} className="space-y-3">
          <h2 className="text-sm font-semibold text-[#A1A1AA]">{group.label}</h2>
          <div className="space-y-4">
            {group.items.map((activity, idx) => {
              const actionType = activity.actionType || (activity as any).activityType;
              const isCurrentUser =
                currentUserId && activity.user?.id === currentUserId;
              const targetLink = getTargetLink(activity);
              const isExpanded = expandedId === activity.id;

              return (
                <div
                  key={activity.id || idx}
                  className="bg-[#232326] border border-zinc-800 rounded-lg p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-white">
                        {getActivityIcon(actionType)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <img
                          src={activity.user?.image || "/default-avatar.png"}
                          alt={activity.user?.name || "User"}
                          className="h-6 w-6 rounded-full border border-zinc-700 object-cover"
                        />
                        <p className="text-white font-semibold">
                          {isCurrentUser
                            ? "You"
                            : activity.user?.name || "Unknown User"}
                        </p>
                        <p className="text-[#A1A1AA]">
                          {isExpanded
                            ? activity.description
                            : activity.description?.slice(0, 160)}
                          {activity.description && activity.description.length > 160 && !isExpanded
                            ? "…"
                            : ""}
                        </p>
                        {activity.description && activity.description.length > 160 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : activity.id)
                            }
                            className="text-xs text-blue-400 hover:underline"
                          >
                            {isExpanded ? "View less" : "View details"}
                          </button>
                        )}
                      </div>

                      {activity.projectTitle && (
                        <div className="mt-1">
                          <Link
                            href={`/projects/${activity.projectId}`}
                            className="text-xs text-blue-400 hover:underline"
                          >
                            {activity.projectTitle}
                          </Link>
                          {targetLink && (
                            <Link
                              href={targetLink}
                              className="text-xs text-[#A1A1AA] ml-3 hover:underline"
                            >
                              View details
                            </Link>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className={getActivityColor(actionType)}>
                          {getActivityLabel(actionType)}
                        </Badge>
                        <p
                          className="text-xs text-[#A1A1AA]"
                          title={`${new Date(
                            activity.createdAt
                          ).toLocaleDateString()} at ${new Date(
                            activity.createdAt
                          ).toLocaleTimeString()}`}
                        >
                          {formatRelativeTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
