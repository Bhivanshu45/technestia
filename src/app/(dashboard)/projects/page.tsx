'use client';
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default function ProjectsPage() {
  return (
    <div className="flex min-h-screen bg-[#18181b] text-[#f4f4f5e4]">
      <DashboardSidebar />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* Content for My Projects - All Projects List will go here */}
        <h1 className="text-2xl font-bold mb-6 text-white">All Projects</h1>
        {/* TODO: Render projects list, create, archived, etc. based on route */}
      </main>
    </div>
  );
}
