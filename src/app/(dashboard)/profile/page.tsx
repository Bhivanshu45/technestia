"use client";

import React from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { useProjects, useCollaboratedProjects } from "@/hooks/useProjects";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Settings, KeyRound, Image as ImageIcon, Trash2 } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading, isError } = useProfile();
  const { projects } = useProjects();
  const { projects: collaboratedProjects } = useCollaboratedProjects();

  if (isLoading) {
    return <LoadingSkeleton type="detail" />;
  }

  if (isError || !user) {
    return (
      <EmptyState
        icon={User}
        title="Profile not available"
        description="We couldn't load your profile right now."
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Profile</h1>
          <p className="text-[#A1A1AA] text-sm">Manage your account and profile details</p>
        </div>
        <Link href="/profile/edit">
          <Button className="gap-2">
            <Settings className="h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#232326] border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={user.image || "/default-avatar.png"}
              alt={user.name}
              className="h-16 w-16 rounded-full border border-zinc-700 object-cover"
            />
            <div>
              <h2 className="text-xl font-semibold text-white">{user.name}</h2>
              <p className="text-sm text-[#A1A1AA]">@{user.username}</p>
              <p className="text-sm text-[#A1A1AA]">{user.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-[#A1A1AA]">Bio</p>
              <p className="text-white text-sm mt-1">
                {user.bio || "No bio added yet."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {user.githubUrl && (
                <Badge variant="secondary">GitHub</Badge>
              )}
              {user.linkedinUrl && (
                <Badge variant="secondary">LinkedIn</Badge>
              )}
              {user.websiteUrl && (
                <Badge variant="secondary">Website</Badge>
              )}
              {!user.githubUrl && !user.linkedinUrl && !user.websiteUrl && (
                <p className="text-xs text-[#A1A1AA]">No social links added.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Stats</h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-[#18181b] rounded-lg p-4">
              <p className="text-2xl font-bold text-white">{projects.length}</p>
              <p className="text-xs text-[#A1A1AA]">Owned Projects</p>
            </div>
            <div className="bg-[#18181b] rounded-lg p-4">
              <p className="text-2xl font-bold text-white">{collaboratedProjects.length}</p>
              <p className="text-xs text-[#A1A1AA]">Collaborations</p>
            </div>
            <div className="bg-[#18181b] rounded-lg p-4">
              <p className="text-sm text-white">{user.role}</p>
              <p className="text-xs text-[#A1A1AA]">Role</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/profile/change-password">
          <Button variant="secondary" className="w-full gap-2">
            <KeyRound className="h-4 w-4" />
            Change Password
          </Button>
        </Link>
        <Link href="/profile/change-avatar">
          <Button variant="secondary" className="w-full gap-2">
            <ImageIcon className="h-4 w-4" />
            Change Avatar
          </Button>
        </Link>
        <Link href="/profile/delete-account">
          <Button variant="destructive" className="w-full gap-2">
            <Trash2 className="h-4 w-4" />
            Delete Account
          </Button>
        </Link>
      </div>
    </div>
  );
}
