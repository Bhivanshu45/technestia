"use client";

import React from "react";
import Link from "next/link";
import { useMyRequests } from "@/hooks/useMyRequests";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

const statusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-900 text-yellow-200";
    case "ACCEPTED":
      return "bg-green-900 text-green-200";
    case "REJECTED":
      return "bg-red-900 text-red-200";
    default:
      return "bg-gray-700 text-gray-200";
  }
};

export default function MyRequestsPage() {
  const { requests, isLoading } = useMyRequests();

  if (isLoading) return <LoadingSkeleton type="detail" />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">My Requests</h1>
        <p className="text-[#A1A1AA] text-sm">Track projects you requested to join</p>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No requests yet"
          description="Send a collaboration request from a project page to see it here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {requests.map((req: any) => (
            <div key={req.id} className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-white font-semibold">{req.project.title}</h3>
                <Badge className={statusColor(req.status)}>{req.status.toLowerCase()}</Badge>
              </div>
              <p className="text-sm text-[#A1A1AA] line-clamp-2 mb-3">
                {req.project.description}
              </p>
              <Link href={`/projects/${req.project.id}`}>
                <Button size="sm">Open</Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
