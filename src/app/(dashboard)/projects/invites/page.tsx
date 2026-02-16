"use client";

import React from "react";
import { Mail } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";

export default function ProjectInvitesPage() {
  // TODO: Implement project invites API and hook
  const invites: any[] = [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl md:text-2xl font-bold text-white mb-1">
          Project Invites
        </h1>
        <p className="text-[#A1A1AA] text-sm">
          Manage invitations to collaborate on projects
        </p>
      </div>

      {/* Invites List */}
      {invites.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No pending invites"
          description="You don't have any pending project invitations at the moment."
        />
      ) : (
        <div>
          {/* TODO: Implement invites list with accept/reject actions */}
        </div>
      )}
    </div>
  );
}
