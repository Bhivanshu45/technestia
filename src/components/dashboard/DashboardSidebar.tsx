"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarOption = { label: string; href: string };
const sidebarOptions: Record<string, SidebarOption[]> = {
  projects: [
    { label: "All Projects", href: "/projects" },
    { label: "Create Project", href: "/projects/create" },
    { label: "Archived Projects", href: "/projects/archived" },
    {
      label: "Collaborated Projects",
      href: "/projects/collaborated",
    },
    { label: "Project Invites", href: "/projects/invites" },
  ],
  profile: [
    { label: "View Profile", href: "/profile" },
    { label: "Edit Profile", href: "/profile/edit" },
    { label: "Change Password", href: "/profile/change-password" },
    { label: "Change Avatar", href: "/profile/change-avatar" },
    { label: "Delete Account", href: "/profile/delete-account" },
  ],
  collaborations: [
    { label: "Active Collaborations", href: "/collaborations" },
    {
      label: "Collaboration Invitations",
      href: "/collaborations/invitations",
    },
    {
      label: "Collaboration Requests",
      href: "/collaborations/requests",
    },
    {
      label: "Collaboration History",
      href: "/collaborations/history",
    },
    { label: "Pending Actions", href: "/collaborations/pending" },
  ],
  activity: [
    { label: "Activity Log", href: "/activity" },
    { label: "Notifications", href: "/activity/notifications" },
  ],
  settings: [
    { label: "General Settings", href: "/settings" },
    { label: "Social Links", href: "/settings/social-links" },
    { label: "Media/Screenshots", href: "/settings/media" },
    { label: "Privacy Settings", href: "/settings/privacy" },
    {
      label: "Notification Preferences",
      href: "/settings/notifications",
    },
    { label: "Account Preferences", href: "/settings/account" },
  ],
  achievements: [
    {
      label: "Milestones Completed",
      href: "/achievements/milestones",
    },
    { label: "Project Awards", href: "/achievements/awards" },
    {
      label: "Top Collaborator",
      href: "/achievements/top-collaborator",
    },
    {
      label: "Contribution Stats",
      href: "/achievements/contributions",
    },
  ],
  chats: [{ label: "Chats", href: "/chats" }],
};

export default function DashboardSidebar() {
  const pathname = usePathname();
  // Determine meta option from pathname
  const meta = pathname?.split("/")[2] || "projects";
  const options: SidebarOption[] =
    sidebarOptions[meta] || sidebarOptions["projects"];
  return (
    <aside className="w-64 min-h-screen bg-[#232326] border-r border-zinc-800 flex flex-col py-8 px-4">
      <div className="mb-8 text-xl font-bold text-white tracking-tight capitalize">
        {meta.replace(/-/g, " ")}
      </div>
      <nav className="flex flex-col gap-2">
        {options.map((item: SidebarOption) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-base ${
              pathname === item.href
                ? "bg-blue-700 text-white"
                : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
