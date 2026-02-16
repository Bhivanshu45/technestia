"use client";

import React, { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useProjects, useCollaboratedProjects } from "@/hooks/useProjects";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import ActivityTimeline, {
  ActivityFeedItem,
} from "@/components/activity/ActivityTimeline";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivityType } from "@/types/activity";

const ACTIVITY_TYPES: ActivityType[] = [
  "POST_PROJECT",
  "UPDATE_PROJECT",
  "DELETE_PROJECT",
  "CREATE_MILESTONE",
  "UPDATE_MILESTONE",
  "DELETE_MILESTONE",
  "CREATE_FEEDBACK",
  "REACT_FEEDBACK",
  "REQUEST_COLLABORATION",
  "APPROVE_COLLABORATION",
  "REJECT_COLLABORATION",
  "LEAVE_PROJECT",
  "REMOVED_FORM_PROJECT",
];

export default function ActivityPage() {
  const { data: session } = useSession();
  const { projects, isLoading: loadingOwned, isError: ownedError } = useProjects();
  const {
    projects: collaboratedProjects,
    isLoading: loadingCollab,
    isError: collabError,
  } = useCollaboratedProjects();

  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allProjects = useMemo(() => {
    const map = new Map<number, { id: number; title: string }>();
    projects.forEach((p: any) => map.set(p.id, { id: p.id, title: p.title }));
    collaboratedProjects.forEach((p: any) =>
      map.set(p.id, { id: p.id, title: p.title })
    );
    return Array.from(map.values());
  }, [projects, collaboratedProjects]);

  const { activityLogs, isLoading, isError, mutate } = useActivityFeed(allProjects);

  const filtered = useMemo(() => {
    let items: ActivityFeedItem[] = [...activityLogs];

    if (projectFilter !== "all") {
      const projectId = Number(projectFilter);
      items = items.filter((item) => item.projectId === projectId);
    }

    if (typeFilter !== "all") {
      items = items.filter((item) => item.actionType === typeFilter);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter((item) => {
        const description = item.description?.toLowerCase() || "";
        const user = item.user?.name?.toLowerCase() || "";
        const project = item.projectTitle?.toLowerCase() || "";
        return (
          description.includes(q) ||
          user.includes(q) ||
          project.includes(q)
        );
      });
    }

    return items;
  }, [activityLogs, projectFilter, typeFilter, query]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as string[];
    const suggestionSet = new Set<string>();
    activityLogs.forEach((item) => {
      if (item.user?.name) suggestionSet.add(item.user.name);
      if (item.projectTitle) suggestionSet.add(item.projectTitle);
    });
    return Array.from(suggestionSet).filter((value) =>
      value.toLowerCase().includes(q)
    );
  }, [activityLogs, query]);

  const visibleItems = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  if (loadingOwned || loadingCollab) {
    return (
      <div className="p-6">
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  if (ownedError || collabError || isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load activity"
          message="We couldn't fetch your activity logs. Please try again."
          onRetry={() => mutate()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Activity</h1>
        <p className="text-[#A1A1AA] text-sm">
          A unified timeline of actions across your projects
        </p>
      </div>

      <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4 sticky top-[96px] z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-[#A1A1AA]">Project</p>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {allProjects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-[#A1A1AA]">Activity type</p>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {ACTIVITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, " ").toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-[#A1A1AA]">Search</p>
            <div className="relative">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search by user, project, or description"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-30 w-full mt-2 bg-[#18181b] border border-zinc-800 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {suggestions.slice(0, 6).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#232326]"
                      onClick={() => {
                        setQuery(suggestion);
                        setShowSuggestions(false);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <ActivityTimeline
        items={visibleItems}
        isLoading={isLoading}
        currentUserId={Number(session?.user?.id || 0)}
      />

      {filtered.length > visibleCount && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => setVisibleCount((prev) => prev + 20)}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
