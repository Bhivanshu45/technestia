"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";

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
    { label: "Overview", href: "/collaborations" },
    { label: "Join Project", href: "/collaborations/join" },
    { label: "Invites (Incoming)", href: "/collaborations/invitations" },
    { label: "Requests (Incoming)", href: "/collaborations/requests" },
    { label: "Team Management", href: "/collaborations/pending" },
    { label: "My Requests", href: "/collaborations/my-requests" },
    { label: "History", href: "/collaborations/history" },
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
  const section = pathname?.split("/")[1] || "projects";
  const options: SidebarOption[] =
    sidebarOptions[section] || sidebarOptions["projects"];
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#232326] border-r border-zinc-800 flex flex-col py-6 px-4 overflow-y-auto z-40">
      <div className="text-lg font-bold text-white tracking-tight capitalize mt-[88px] mb-4">
        {section.replace(/-/g, " ")}
      </div>
      <Separator className="mb-6 bg-zinc-700" />
      <nav className="flex flex-col gap-2">
        {options.map((item: SidebarOption) => {
          // Exact match OR parent of detail page (e.g., /projects matches /projects/123)
          const pathParts = pathname?.split("/").filter(Boolean) || [];
          const itemParts = item.href.split("/").filter(Boolean) || [];
          
          const isExactMatch = pathname === item.href;
          const isDetailPage = 
            pathParts.length === itemParts.length + 1 && 
            pathParts[itemParts.length] !== "" &&
            !isNaN(Number(pathParts[itemParts.length]));
          const isActive = isExactMatch || (isDetailPage && pathname?.startsWith(item.href + "/"));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-base ${
                isActive
                  ? "bg-blue-700 text-white"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
