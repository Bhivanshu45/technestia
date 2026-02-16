"use client";

import React, { useState } from "react";
import { useFeedbacks } from "@/hooks/useFeedbacks";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageCircle } from "lucide-react";

export default function ProjectFeedbacksTab({ projectId }: any) {
  const { feedbacks, isLoading } = useFeedbacks(projectId);
  const [sortBy, setSortBy] = useState("recent");

  if (isLoading) return <LoadingSkeleton type="list" />;

  const sorted = [...(feedbacks || [])].sort((a: any, b: any) => {
    if (sortBy === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "helpful") return (b.reactions?.length || 0) - (a.reactions?.length || 0);
    return 0;
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-400";
    if (rating >= 3) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex gap-2 bg-[#232326] border border-zinc-800 rounded-lg p-4">
        {["recent", "helpful"].map((sort) => (
          <Button
            key={sort}
            variant={sortBy === sort ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy(sort)}
            className={`${
              sortBy === sort
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-[#1f1f23] text-white border border-zinc-700 hover:bg-[#2a2a2f]"
            }`}
          >
            {sort === "helpful" ? "Most Helpful" : "Most Recent"}
          </Button>
        ))}
      </div>

      {/* Feedbacks List */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No feedbacks yet"
          description="Be the first to share your feedback about this project"
        />
      ) : (
        <div className="space-y-4">
          {sorted.map((feedback: any) => {
            const rating = feedback.rating ?? 0;
            return (
            <div
              key={feedback.id}
              className="bg-[#232326] border border-zinc-800 rounded-lg p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold text-white">
                      {feedback.createdBy?.name || "Anonymous"}
                    </p>
                    {feedback.rating !== null && feedback.rating !== undefined ? (
                      <div className={`flex gap-1 ${getRatingColor(rating)}`}>
                        {[...Array(5)].map((_, i) => (
                          <span key={i}>{i < rating ? "★" : "☆"}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-[#A1A1AA]">No rating</span>
                    )}
                  </div>
                  <p className="text-sm text-[#A1A1AA]">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <p className="text-[#A1A1AA] mb-4">
                {feedback.content}
              </p>

              {/* Reactions */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-[#A1A1AA] hover:text-white"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Helpful ({feedback.reactions?.length || 0})
                </Button>
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
