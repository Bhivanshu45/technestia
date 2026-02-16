"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useProject } from "@/hooks/useProject";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectOverviewTab from "../../../../components/projects/tabs/ProjectOverviewTab";
import ProjectMilestonesTab from "../../../../components/projects/tabs/ProjectMilestonesTab";
import ProjectFeedbacksTab from "../../../../components/projects/tabs/ProjectFeedbacksTab";
import ProjectActivityTab from "../../../../components/projects/tabs/ProjectActivityTab";
import ProjectSettingsTab from "../../../../components/projects/tabs/ProjectSettingsTab";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { project, isLoading, isError, mutate } = useProject(projectId);

  const [activeTab, setActiveTab] = useState("overview");
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (!tab) return;
    const allowed = ["overview", "milestones", "feedbacks", "activity", "settings"];
    if (allowed.includes(tab)) setActiveTab(tab);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <ErrorState
        title="Project not found"
        message="We couldn't load this project. It may have been deleted or you don't have access to it."
        onRetry={() => mutate()}
      />
    );
  }

  const isOwner = project.userId === parseInt(session?.user?.id || "0");
  const hasAccess = isOwner || Boolean(project.accessLevel);

  const handleRequestToJoin = async () => {
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
    <div className="space-y-4">
      {/* Project Header */}
      <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4 md:p-5">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl md:text-2xl font-bold text-white">
              {project.title}
            </h1>
            <p className="text-[#A1A1AA] text-xs md:text-sm">
              {project.isPublic ? "Public project" : "Private project"}
            </p>
          </div>
          {!isOwner && !hasAccess && (
            <Button
              onClick={handleRequestToJoin}
              disabled={isRequesting}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              {isRequesting ? "Requesting..." : "Request to Join"}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-[#232326] border border-zinc-800 text-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          {isOwner && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProjectOverviewTab project={project} isOwner={isOwner} />
        </TabsContent>

        <TabsContent value="milestones" className="space-y-6">
          <ProjectMilestonesTab projectId={projectId} isOwner={isOwner} />
        </TabsContent>

        <TabsContent value="feedbacks" className="space-y-6">
          <ProjectFeedbacksTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <ProjectActivityTab projectId={projectId} />
        </TabsContent>

        {isOwner && (
          <TabsContent value="settings" className="space-y-6">
            <ProjectSettingsTab project={project} onUpdate={mutate} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
