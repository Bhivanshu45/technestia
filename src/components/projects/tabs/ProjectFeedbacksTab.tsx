"use client";

import React, { useState } from "react";
import { useFeedbacks } from "@/hooks/useFeedbacks";
import { useFeedbackActions } from "@/hooks/useFeedbackActions";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, ThumbsUp, Pencil, Trash2, Plus, Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function ProjectFeedbacksTab({ projectId }: any) {
  const { data: session } = useSession();
  const currentUserId = Number(session?.user?.id || 0);
  const { feedbacks, isLoading, mutate } = useFeedbacks(projectId);
  const {
    isLoading: isActionLoading,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    reactToFeedback,
    removeReaction,
  } = useFeedbackActions();

  const [sortBy, setSortBy] = useState("recent");
  const [showDialog, setShowDialog] = useState(false);
  const [editingFeedbackId, setEditingFeedbackId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);

  const myFeedback = feedbacks.find((feedback: any) => feedback.createdById === currentUserId);

  const openCreateDialog = () => {
    setEditingFeedbackId(null);
    setContent("");
    setRating(5);
    setShowDialog(true);
  };

  const openEditDialog = (feedback: any) => {
    setEditingFeedbackId(feedback.id);
    setContent(feedback.content || "");
    setRating(Number(feedback.rating ?? 5));
    setShowDialog(true);
  };

  const handleSubmitFeedback = async () => {
    const payload = {
      content: content.trim(),
      rating,
    };

    if (!payload.content) {
      toast.error("Feedback content is required");
      return;
    }

    try {
      if (editingFeedbackId) {
        await updateFeedback(editingFeedbackId, payload);
        toast.success("Feedback updated");
      } else {
        await createFeedback(projectId, payload);
        toast.success("Feedback submitted");
      }

      setShowDialog(false);
      await mutate();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save feedback");
    }
  };

  const handleDeleteFeedback = async (feedbackId: number) => {
    try {
      await deleteFeedback(feedbackId);
      toast.success("Feedback deleted");
      await mutate();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete feedback");
    }
  };

  const handleToggleReaction = async (feedback: any) => {
    const myReaction = feedback.reactions?.find((reaction: any) => reaction.userId === currentUserId);

    try {
      if (myReaction) {
        await removeReaction(feedback.id);
      } else {
        await reactToFeedback(feedback.id, "LIKE");
      }

      await mutate();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update reaction");
    }
  };

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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#232326] border border-zinc-800 rounded-lg p-4">
        <div className="flex gap-2">
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
        {!myFeedback && (
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Feedback
          </Button>
        )}
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

              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleReaction(feedback)}
                  disabled={isActionLoading}
                  className={`gap-2 ${
                    feedback.reactions?.some((reaction: any) => reaction.userId === currentUserId)
                      ? "text-blue-400"
                      : "text-[#A1A1AA] hover:text-white"
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  Helpful ({feedback.reactions?.length || 0})
                </Button>

                {feedback.createdById === currentUserId && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(feedback)}
                      disabled={isActionLoading}
                      className="gap-2"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteFeedback(feedback.id)}
                      disabled={isActionLoading}
                      className="gap-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#232326] border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>{editingFeedbackId ? "Edit Feedback" : "Add Feedback"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your feedback..."
              className="min-h-28"
            />
            <div>
              <p className="text-sm text-zinc-400 mb-2">Rating</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="rounded-md p-1 transition-transform hover:scale-105"
                    aria-label={`Set rating to ${value}`}
                  >
                    <Star
                      className={`h-6 w-6 ${value <= rating ? "fill-yellow-400 text-yellow-400" : "text-zinc-600"}`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-zinc-400">{rating}/5</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="border-zinc-700 bg-[#18181b] text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitFeedback} disabled={isActionLoading}>
              {isActionLoading ? "Saving..." : editingFeedbackId ? "Update" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
