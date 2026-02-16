"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import Navbar from "@/components/navbar/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  // Redirect to sign in if not authenticated
  if (status === "unauthenticated") {
    redirect("/auth/sign-in");
  }

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#18181b] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#18181b] text-[#f4f4f5e4]">
      <Navbar />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 ml-64 pt-[88px] px-6 md:px-10 pb-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
