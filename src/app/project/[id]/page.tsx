"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import { FaGithub } from "react-icons/fa";
import { FiArrowUpRight } from "react-icons/fi";
import ProjectMetaSection from "@/components/project/ProjectMetaSection";
import ProjectTeamSection from "@/components/project/ProjectTeamSection";

interface User {
  id: string;
  name: string;
  username: string;
  image?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  techStack?: string[];
  tags?: string[];
  status?: string;
  isPublic?: boolean;
  githubUrl?: string;
  liveDemoUrl?: string;
  screenshots?: string[];
  uploadedAt?: string;
  lastUpdatedAt?: string;
  creator: User;
  collaborators: User[];
}

const ProjectDetailPage = () => {
  const params = useParams();
  const projectId = params?.id as string;

  const { data, error, isLoading } = useSWR<any>(
    projectId ? `/api/project/public-details/${projectId}` : null,
    fetcher
  );

  if (isLoading) {
    return <div className="text-center py-10 text-zinc-500">Loading project...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Failed to load project.</div>;
  }

  if (!data || !data.success || !data.project) {
    return <div className="text-center py-10 text-zinc-500">Project not found.</div>;
  }

  const project: Project = data.project;

  return (
    <>
      <main className="w-full min-h-screen bg-[#18181b] text-[#f4f4f5e4] px-0 md:px-0">
      {/* Hero Section */}
      <section className="w-full flex flex-col items-center justify-center pt-10 pb-4 bg-[#232326] border-b border-[#232326]">
        {/* Screenshot Carousel or Thumbnail */}
        {project.screenshots && project.screenshots.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto w-full max-w-3xl justify-center mb-4">
            {project.screenshots.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`Screenshot ${idx + 1}`}
                className="h-48 rounded-lg border border-zinc-700 bg-[#1f1f22] object-cover"
                style={{ minWidth: 180 }}
              />
            ))}
          </div>
        ) : (
          <div className="w-48 h-48 rounded-lg border border-zinc-700 bg-[#1f1f22] flex items-center justify-center text-zinc-600 text-sm mb-4">
            No Image
          </div>
        )}
        <div className="w-full max-w-3xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-2">
          <div className="flex-1 flex flex-col items-center md:items-start">
            <h1 className="text-3xl md:text-4xl font-bold mb-1 text-white break-words text-center md:text-left">{project.title}</h1>
            {/* Status and Public badge below title */}
            <div className="flex items-center gap-3 mb-2 justify-center md:justify-start w-full">
              <span className="font-semibold text-orange-300 tracking-wide">
                Stage :
              </span>
              <span className="font-medium text-blue-400 tracking-wide">
                {project.status}
              </span>
              {project.isPublic && (
                <span className="text-xs bg-green-700 text-white px-2 py-0.5 rounded">Public</span>
              )}
            </div>
            <p className="text-[#A1A1AA] text-base mb-2 text-center md:text-left max-w-2xl">{project.description?.slice(0, 120)}{project.description && project.description.length > 120 ? '...' : ''}</p>
            {/* Tags*/}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {project.tags.map((tag) => (
                  <span key={tag} className="bg-blue-900 text-blue-300 border border-blue-700 text-xs px-3 py-1 rounded hover:underline cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {project.techStack && project.techStack.map((tech) => (
                <span key={tech} className="bg-[#18181b] border border-zinc-700 text-xs px-3 py-1 rounded text-white">
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            {project.githubUrl && (
              <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition flex items-center gap-2">
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <FaGithub size={20} />
                  <span>GitHub</span>
                  <FiArrowUpRight size={18} className="ml-1" />
                </a>
              </Button>
            )}
            {project.liveDemoUrl && (
              <Button asChild variant="default" className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition flex items-center gap-2">
                <a
                  href={project.liveDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <span>Live Demo</span>
                  <FiArrowUpRight size={18} className="ml-1" />
                </a>
              </Button>
            )}
          </div>
        </div>
  {/* Removed old status/public/tags row for clarity */}
      </section>

      {/* About Section */}
      <section className="w-full flex flex-col items-center justify-center py-8 px-2">
        <div className="w-full max-w-3xl">
          <h2 className="text-xl font-semibold mb-2 text-white">About The Project</h2>
          <p className="text-[#f4f4f5e4] mb-6 whitespace-pre-line text-left w-full max-w-2xl mx-auto text-base leading-relaxed bg-[#232326] p-4 rounded-lg border border-zinc-800">
            {project.description}
          </p>
        </div>
      </section>

      {/* Media Section */}
      {project.screenshots && project.screenshots.length > 0 && (
        <section className="w-full flex flex-col items-center justify-center pb-8 px-2">
          <div className="w-full max-w-3xl">
            <h2 className="text-xl font-semibold mb-2 text-white">Screenshots</h2>
            <div className="flex gap-3 overflow-x-auto w-full">
              {project.screenshots.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Screenshot ${idx + 1}`}
                  className="h-40 rounded-lg border border-zinc-700 bg-[#1f1f22] object-cover"
                  style={{ minWidth: 160 }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

  {/* Creator & Collaborators Section */}
  <ProjectTeamSection creator={project.creator} collaborators={project.collaborators} />

  {/* Metadata & External Links Section */}
  <ProjectMetaSection uploadedAt={project.uploadedAt} lastUpdatedAt={project.lastUpdatedAt} />

      </main>
    </>
  );
};

export default ProjectDetailPage;
