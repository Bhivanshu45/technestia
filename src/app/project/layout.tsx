import React from "react";
import Navbar from "@/components/navbar/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#18181b] text-[#f4f4f5e4]">
      <Navbar />
      {children}
    </div>
  );
}
