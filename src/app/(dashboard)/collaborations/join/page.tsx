"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMyRequests } from "@/hooks/useMyRequests";
import { useMyInvites } from "@/hooks/useMyInvites";
import { useProjects, useCollaboratedProjects } from "@/hooks/useProjects";

export default function JoinProjectPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestingId, setRequestingId] = useState<number | null>(null);
  const { requests } = useMyRequests();
  const { invites } = useMyInvites();
  const { projects: ownedProjects } = useProjects();
  const { projects: collaboratedProjects } = useCollaboratedProjects();

  const requestMap = useMemo(() => {
    const map = new Map<number, string>();
    requests.forEach((r: any) => map.set(r.project.id, r.status));
    return map;
  }, [requests]);

  const inviteSet = useMemo(() => {
    const set = new Set<number>();
    invites.forEach((i: any) => set.add(i.project.id));
    return set;
  }, [invites]);

  const ownedSet = useMemo(() => {
    const set = new Set<number>();
    ownedProjects.forEach((p: any) => set.add(p.id));
    return set;
  }, [ownedProjects]);

  const collaboratedSet = useMemo(() => {
    const set = new Set<number>();
    collaboratedProjects.forEach((p: any) => set.add(p.id));
    return set;
  }, [collaboratedProjects]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!search.trim()) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await axios.get(
          `/api/search/projects?query=${encodeURIComponent(search.trim())}`
        );
        if (active) {
          setResults(res.data?.data || []);
        }
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setIsSearching(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [search]);

  const handleRequestToJoin = async (projectId: number) => {
    if (requestingId) return;
    setRequestingId(projectId);
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
      setRequestingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Join Project</h1>
        <p className="text-[#A1A1AA] text-sm">Search public projects and request collaboration</p>
      </div>

      <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4 space-y-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by project title or tag"
        />
        {isSearching ? (
          <p className="text-xs text-[#A1A1AA]">Searching...</p>
        ) : results.length === 0 ? (
          <p className="text-xs text-[#A1A1AA]">No results yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {results.map((project: any) => {
              const isOwner = ownedSet.has(project.id);
              const isJoined = collaboratedSet.has(project.id);

              return (
                <div key={project.id} className="bg-[#18181b] border border-zinc-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-1">
                    {project.title || project.name}
                  </h3>
                  <p className="text-sm text-[#A1A1AA] line-clamp-2 mb-3">
                    {project.description}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/project/${project.id}`}>
                      <Button size="sm" variant="secondary">
                        View
                      </Button>
                    </Link>
                    {isOwner ? (
                      <Badge variant="secondary">Owner</Badge>
                    ) : isJoined ? (
                      <Badge variant="secondary">Already Joined</Badge>
                    ) : inviteSet.has(project.id) ? (
                      <Link href="/collaborations/invitations">
                        <Button size="sm">Accept Invite</Button>
                      </Link>
                    ) : requestMap.has(project.id) ? (
                      <Button size="sm" variant="outline" disabled>
                        {requestMap.get(project.id) === "PENDING"
                          ? "Request Pending"
                          : requestMap.get(project.id) === "ACCEPTED"
                          ? "Already Joined"
                          : "Request Rejected"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleRequestToJoin(project.id)}
                        disabled={requestingId === project.id}
                      >
                        {requestingId === project.id ? "Requesting..." : "Request to Join"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
