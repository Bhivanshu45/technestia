"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";

export default function ArchivedProjectPage() {
  const router = useRouter();
  const { projects, isLoading } = useProjects();
  const archivedProjects = projects.filter((project) => project.status === "COMPLETED");

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Archived Projects</h1>
          <p className="text-[#A1A1AA] text-sm">
            Completed work is surfaced here until dedicated archive support is added.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-zinc-700 bg-[#232326] text-white hover:bg-zinc-800"
            onClick={() => router.push("/projects")}
          >
            View all projects
          </Button>
          <Button onClick={() => router.push("/projects/create")}>Create project</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-[#A1A1AA]">Total projects</p>
          <p className="text-2xl font-bold text-white mt-1">{isLoading ? "-" : projects.length}</p>
        </div>
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-[#A1A1AA]">Completed</p>
          <p className="text-2xl font-bold text-white mt-1">{isLoading ? "-" : archivedProjects.length}</p>
        </div>
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-[#A1A1AA]">Visible in archive</p>
          <p className="text-2xl font-bold text-white mt-1">{archivedProjects.length}</p>
        </div>
      </div>

      {archivedProjects.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="No archived projects yet"
          description="Completed projects will show up here once you have finished work to review later."
          actionLabel="Back to projects"
          onAction={() => router.push("/projects")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {archivedProjects.map((project) => (
            <div key={project.id} className="bg-[#232326] border border-zinc-800 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-white font-semibold">{project.title}</h3>
                  <p className="text-sm text-[#A1A1AA] line-clamp-3">{project.description}</p>
                </div>
                <Badge className="bg-green-900 text-green-200">Completed</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
                <span>{project.isPublic ? "Public" : "Private"}</span>
                <span>
                  {project.lastUpdatedAt
                    ? new Date(project.lastUpdatedAt).toLocaleDateString()
                    : "Recently"}
                </span>
              </div>
              <Button asChild variant="outline" className="w-full border-zinc-700 bg-[#18181b] text-white hover:bg-zinc-800">
                <Link href={`/projects/${project.id}`}>Open project</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
