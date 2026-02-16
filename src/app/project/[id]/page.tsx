"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import { FaGithub } from "react-icons/fa";
import { FiArrowUpRight } from "react-icons/fi";
import ProjectMetaSection from "@/components/project/ProjectMetaSection";
import ProjectTeamSection from "@/components/project/ProjectTeamSection";
import ProjectMediaGallery from "@/components/project/ProjectMediaGallery";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { useMyInvites } from "@/hooks/useMyInvites";
import { useMyRequests } from "@/hooks/useMyRequests";

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
  const { data: session } = useSession();
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);
  const { invites } = useMyInvites();
  const { requests } = useMyRequests();

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
  const currentUserId = String(session?.user?.id || "");
  const isOwner = String(project.creator?.id) === currentUserId;
  const isCollaborator = project.collaborators?.some(
    (collab) => String(collab.id) === currentUserId
  );
  const hasInvite = invites.some((invite: any) => String(invite.project.id) === String(project.id));
  const myRequest = requests.find(
    (req: any) => String(req.project.id) === String(project.id)
  );
  const mediaItems = (project.screenshots || []).map((url) => ({ type: "image" as const, url }));
  const teamCount = 1 + (project.collaborators?.length || 0);

  const handleRequestToJoin = async () => {
    if (!session?.user?.id) {
      router.push("/auth/sign-in");
      return;
    }
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      const res = await axios.post(`/api/project/collab-request/${projectId}`);
      if (res.data.success) {
        toast.success("Request sent successfully");
      } else {
        toast.error(res.data.message || "Failed to send request");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send request");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <>
      <main className="w-full min-h-screen bg-[#0b0b0f] text-zinc-100">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-zinc-800/70">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />
          <div className="relative w-full max-w-6xl mx-auto px-4 pt-16 sm:pt-20 pb-12">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                  <span className="px-2 py-1 rounded-full bg-zinc-900/70 border border-zinc-800 text-zinc-300">
                    Stage: {project.status || "Unspecified"}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-zinc-900/70 border border-zinc-800 text-zinc-300">
                    {project.isPublic ? "Public" : "Private"}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-3 break-words">
                  {project.title}
                </h1>
                <p className="text-zinc-300 text-base sm:text-lg leading-relaxed max-w-2xl">
                  {project.description?.slice(0, 180)}
                  {project.description && project.description.length > 180 ? "..." : ""}
                </p>

                {(project.tags?.length || 0) > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {project.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="bg-blue-950/70 text-blue-300 border border-blue-900 text-xs px-3 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {(project.techStack?.length || 0) > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {project.techStack?.map((tech) => (
                      <span
                        key={tech}
                        className="bg-zinc-900/70 border border-zinc-800 text-xs px-3 py-1 rounded-full text-white"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-6">
                  {!isOwner && !isCollaborator && (
                    <Button
                      variant="default"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2 rounded-lg transition"
                      onClick={hasInvite ? () => router.push("/collaborations/invitations") : handleRequestToJoin}
                      disabled={isRequesting || Boolean(myRequest)}
                    >
                      {hasInvite
                        ? "Accept Invite"
                        : myRequest?.status === "PENDING"
                        ? "Request Pending"
                        : myRequest?.status === "REJECTED"
                        ? "Request Rejected"
                        : isRequesting
                        ? "Requesting..."
                        : "Request to Join"}
                    </Button>
                  )}
                  {project.githubUrl && (
                    <Button
                      asChild
                      variant="outline"
                      className="border-zinc-700 bg-zinc-950/60 text-zinc-100 hover:bg-zinc-900/70 text-sm px-5 py-2 rounded-lg"
                    >
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <FaGithub size={18} />
                        <span>GitHub</span>
                        <FiArrowUpRight size={16} />
                      </a>
                    </Button>
                  )}
                  {project.liveDemoUrl && (
                    <Button
                      asChild
                      variant="outline"
                      className="border-emerald-700/60 bg-emerald-950/30 text-emerald-200 hover:bg-emerald-950/50 text-sm px-5 py-2 rounded-lg"
                    >
                      <a
                        href={project.liveDemoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <span>Live Demo</span>
                        <FiArrowUpRight size={16} />
                      </a>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3">
                    <div className="text-xs text-zinc-400">Team</div>
                    <div className="text-sm font-semibold text-white">
                      {teamCount} member{teamCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3">
                    <div className="text-xs text-zinc-400">Created</div>
                    <div className="text-sm font-semibold text-white">
                      {project.uploadedAt ? new Date(project.uploadedAt).toLocaleDateString() : "-"}
                    </div>
                  </div>
                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3">
                    <div className="text-xs text-zinc-400">Updated</div>
                    <div className="text-sm font-semibold text-white">
                      {project.lastUpdatedAt ? new Date(project.lastUpdatedAt).toLocaleDateString() : "-"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                {project.screenshots && project.screenshots.length > 0 ? (
                  <div className="w-full h-64 sm:h-72">
                    <img
                      src={project.screenshots[0]}
                      alt={`${project.title} preview`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-64 sm:h-72 bg-zinc-950/60 flex items-center justify-center text-zinc-500 text-sm">
                    No preview available
                  </div>
                )}
                <div className="px-4 py-3 text-xs text-zinc-500 border-t border-zinc-800">Preview</div>
              </div>
            </div>
          </div>
        </section>

        {/* Overview */}
        <section className="w-full px-4 py-10">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-3">About the project</h2>
              <p className="text-zinc-300 whitespace-pre-line leading-relaxed">
                {project.description}
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Project details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Stage</span>
                    <span className="text-zinc-100 font-medium">{project.status || "Unspecified"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Visibility</span>
                    <span className="text-zinc-100 font-medium">{project.isPublic ? "Public" : "Private"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Tags</span>
                    <span className="text-zinc-100 font-medium">{project.tags?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Tech stack</span>
                    <span className="text-zinc-100 font-medium">{project.techStack?.length || 0}</span>
                  </div>
                </div>
              </div>
              {(project.githubUrl || project.liveDemoUrl) && (
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-4">Links</h3>
                  <div className="flex flex-col gap-3 text-sm">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-100 hover:bg-zinc-900/70"
                      >
                        <span>Repository</span>
                        <FiArrowUpRight size={16} />
                      </a>
                    )}
                    {project.liveDemoUrl && (
                      <a
                        href={project.liveDemoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-lg border border-emerald-900/60 bg-emerald-950/30 px-3 py-2 text-emerald-200 hover:bg-emerald-950/50"
                      >
                        <span>Live demo</span>
                        <FiArrowUpRight size={16} />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Gallery */}
        {mediaItems.length > 0 && (
          <section className="w-full px-4 pb-12">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Gallery</h2>
                <span className="text-xs text-zinc-500">{mediaItems.length} items</span>
              </div>
              <ProjectMediaGallery media={mediaItems} className="max-w-6xl" />
            </div>
          </section>
        )}

        {/* Creator & Collaborators Section */}
        <ProjectTeamSection creator={project.creator} collaborators={project.collaborators} />

        {/* Metadata Section */}
        <ProjectMetaSection uploadedAt={project.uploadedAt} lastUpdatedAt={project.lastUpdatedAt} />
      </main>
    </>
  );
};

export default ProjectDetailPage;
