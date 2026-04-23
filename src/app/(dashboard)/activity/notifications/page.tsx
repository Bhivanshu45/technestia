"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Bell, Activity, Sparkles } from "lucide-react";

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    isError,
    mutate,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const latestNotification = notifications[0];

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load notifications"
          message="We couldn't fetch your recent updates right now."
          onRetry={() => mutate()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Notifications</h1>
          <p className="text-[#A1A1AA] text-sm">
            Live updates from your projects and collaborations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-zinc-700 bg-[#232326] text-white hover:bg-zinc-800">
            <Link href="/activity">Activity log</Link>
          </Button>
          <Button onClick={markAllAsRead} disabled={unreadCount === 0}>
            Mark all read
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
          <Bell className="h-5 w-5 text-blue-400 mb-2" />
          <p className="text-xs text-[#A1A1AA]">Unread</p>
          <p className="text-2xl font-bold text-white mt-1">{unreadCount}</p>
        </div>
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
          <Activity className="h-5 w-5 text-green-400 mb-2" />
          <p className="text-xs text-[#A1A1AA]">Total notifications</p>
          <p className="text-2xl font-bold text-white mt-1">{notifications.length}</p>
        </div>
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
          <Sparkles className="h-5 w-5 text-yellow-400 mb-2" />
          <p className="text-xs text-[#A1A1AA]">Latest update</p>
          <p className="text-sm font-semibold text-white mt-1 truncate">
            {latestNotification ? latestNotification.message : "No recent updates"}
          </p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Activity will appear here when your projects start moving."
          actionLabel="Open projects"
          onAction={() => router.push("/projects")}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-[#232326] border rounded-lg p-4 ${
                notification.isRead ? "border-zinc-800" : "border-blue-700/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs mb-1">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 ${
                        notification.isRead
                          ? "bg-zinc-700 text-zinc-200"
                          : "bg-blue-600/20 text-blue-300"
                      }`}
                    >
                      {notification.isRead ? "Read" : "Unread"}
                    </span>
                  </p>
                  <p className="text-white text-sm font-medium break-words">
                    {notification.message}
                  </p>
                  <p className="text-xs text-[#A1A1AA] mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notification.isRead && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-zinc-700 bg-[#1f1f23] text-white hover:bg-[#2a2a2f]"
                    onClick={() => markAsRead(notification.id)}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}