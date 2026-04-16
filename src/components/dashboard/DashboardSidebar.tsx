"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Archive,
  Bell,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  MessageCircle,
  Plus,
  Rocket,
  Send,
  Settings2,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

type SidebarOption = { label: string; href: string; icon: LucideIcon };

const sidebarOptions: Record<string, SidebarOption[]> = {
  projects: [
    { label: "All Projects", href: "/projects", icon: LayoutDashboard },
    { label: "Create Project", href: "/projects/create", icon: Plus },
    { label: "Archived Projects", href: "/projects/archived", icon: Archive },
    { label: "Collaborated Projects", href: "/projects/collaborated", icon: Users },
    { label: "Project Invites", href: "/projects/invites", icon: Inbox },
  ],
  profile: [
    { label: "View Profile", href: "/profile", icon: UserRound },
    { label: "Edit Profile", href: "/profile/edit", icon: Settings2 },
    { label: "Change Password", href: "/profile/change-password", icon: Clock3 },
    { label: "Change Avatar", href: "/profile/change-avatar", icon: Sparkles },
    { label: "Delete Account", href: "/profile/delete-account", icon: Archive },
  ],
  collaborations: [
    { label: "Overview", href: "/collaborations", icon: LayoutDashboard },
    { label: "Join Project", href: "/collaborations/join", icon: Rocket },
    { label: "Invites (Incoming)", href: "/collaborations/invitations", icon: Inbox },
    { label: "Requests (Incoming)", href: "/collaborations/requests", icon: Send },
    { label: "Team Management", href: "/collaborations/pending", icon: Users },
    { label: "My Requests", href: "/collaborations/my-requests", icon: Bell },
    { label: "History", href: "/collaborations/history", icon: Clock3 },
  ],
  activity: [
    { label: "Activity Log", href: "/activity", icon: Activity },
    { label: "Notifications", href: "/activity/notifications", icon: Bell },
  ],
  achievements: [
    { label: "Overview", href: "/achievements", icon: Trophy },
    { label: "Milestones Completed", href: "/achievements/milestones", icon: CheckCircle2 },
    { label: "Project Awards", href: "/achievements/awards", icon: Sparkles },
    { label: "Top Collaborator", href: "/achievements/top-collaborator", icon: Users },
    { label: "Contribution Stats", href: "/achievements/contributions", icon: FolderKanban },
  ],
  chat: [
    { label: "Messages", href: "/chat", icon: MessageCircle },
    { label: "New Chat", href: "/chat/new", icon: Plus },
  ],
};

export default function DashboardSidebar() {
  const pathname = usePathname();
  const section = pathname?.split("/")[1] || "projects";

  const options: SidebarOption[] = sidebarOptions[section] || sidebarOptions.projects;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#232326] border-r border-zinc-800 flex flex-col py-6 px-4 overflow-y-auto z-40">
      <div className="mt-[88px] mb-4">
        <div className="text-lg font-bold text-white tracking-tight capitalize">
          {section.replace(/-/g, " ")}
        </div>
      </div>

      <Separator className="mb-6 bg-zinc-700" />
      <nav className="flex flex-col gap-2">
        {options.map((item: SidebarOption) => {
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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#232326] ${
                isActive
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
