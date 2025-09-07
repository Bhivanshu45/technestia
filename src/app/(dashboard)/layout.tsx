import React from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import Navbar from "@/components/navbar/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#18181b] text-[#f4f4f5e4]">
      <Navbar />
      <DashboardSidebar />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children}</main>
    </div>
  );
}
