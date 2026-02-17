"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useTopUsers } from "@/hooks/useTopUsers";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

export default function TopCollaboratorPage() {
  const { data: session } = useSession();
  const { users, isLoading } = useTopUsers();
  const currentUserId = Number(session?.user?.id || 0);

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Trophy}
          title="No leaderboard data"
          description="Start collaborating to appear on the leaderboard."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Top Collaborators</h1>
        <p className="text-[#A1A1AA] text-sm">
          Community leaders ranked by achievement points
        </p>
      </div>

      <div className="bg-[#232326] border border-zinc-800 rounded-lg divide-y divide-zinc-800">
        {users.map((user, index) => {
          const isCurrentUser = user.id === currentUserId;
          return (
            <div key={user.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 text-center text-sm text-[#A1A1AA]">#{index + 1}</div>
                <img
                  src={user.image || "/default-avatar.png"}
                  alt={user.name}
                  className="h-10 w-10 rounded-full border border-zinc-700 object-cover"
                />
                <div>
                  <p className="text-white font-semibold">{isCurrentUser ? "You" : user.name}</p>
                  <p className="text-xs text-[#A1A1AA]">@{user.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {index === 0 && (
                  <Badge className="bg-yellow-900 text-yellow-200">Top collaborator</Badge>
                )}
                <Badge className="bg-blue-900 text-blue-200">
                  {user.achievementPoints} pts
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
