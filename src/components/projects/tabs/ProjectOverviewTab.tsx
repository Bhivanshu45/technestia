"use client";

import React from "react";
import { ExternalLink, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function ProjectOverviewTab({ project, isOwner }: any) {
  const owner = project.creator || project.user;
  return (
    <div className="space-y-5">
      {/* Top grid: About + Links / Tech Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4 md:p-5 space-y-3">
          <h2 className="text-xl font-semibold text-white">About</h2>
          <p className="text-[#A1A1AA] leading-relaxed text-sm md:text-base">
            {project.description || "No description provided"}
          </p>
        </div>

        {(project.githubUrl || project.liveDemoUrl) && (
          <div className="space-y-5">
            {(project.githubUrl || project.liveDemoUrl) && (
              <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4 md:p-5 space-y-3">
                <h2 className="text-xl font-semibold text-white">Links</h2>
                <div className="flex flex-wrap gap-3">
                  {project.githubUrl && (
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="secondary"
                        className="gap-2 bg-[#1f1f23] text-white border border-zinc-700 hover:bg-[#2a2a2f]"
                      >
                        <Github className="h-4 w-4" />
                        GitHub Repository
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  {project.liveDemoUrl && (
                    <a href={project.liveDemoUrl} target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="secondary"
                        className="gap-2 bg-[#1f1f23] text-white border border-zinc-700 hover:bg-[#2a2a2f]"
                      >
                        Live Demo
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )}

            {project.techStack && project.techStack.length > 0 && (
              <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4 md:p-5 space-y-3">
                <h2 className="text-xl font-semibold text-white">Technologies Used</h2>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-xs md:text-sm rounded-full bg-[#1f1f23] text-white border border-zinc-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Middle grid: Team + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[#232326] border border-zinc-800 rounded-lg p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Team ({(project.collaborators?.length || 0) + 1})
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#18181b] rounded-lg">
              <div>
                <p className="font-semibold text-white">{owner?.name || "Unknown"}</p>
                <p className="text-sm text-[#A1A1AA]">
                  {owner?.username ? `@${owner.username}` : "@unknown"}
                </p>
              </div>
              <Badge variant="default">Owner</Badge>
            </div>

            {project.collaborators?.map((collab: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-[#18181b] rounded-lg">
                <div>
                  <p className="font-semibold text-white">{collab?.name || "Unknown"}</p>
                  <p className="text-sm text-[#A1A1AA]">
                    {collab?.username ? `@${collab.username}` : "@unknown"}
                  </p>
                </div>
                <Badge variant="outline">Collaborator</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4 md:p-5 space-y-3">
          <h2 className="text-xl font-semibold text-white">Summary</h2>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-[#18181b] rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{project.techStack?.length || 0}</p>
              <p className="text-[#A1A1AA] text-xs">Technologies</p>
            </div>
            <div className="bg-[#18181b] rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{project.collaborators?.length || 0}</p>
              <p className="text-[#A1A1AA] text-xs">Collaborators</p>
            </div>
            <div className="bg-[#18181b] rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{project.isPublic ? "Public" : "Private"}</p>
              <p className="text-[#A1A1AA] text-xs">Visibility</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
