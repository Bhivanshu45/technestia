"use client";

import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useMilestones } from "@/hooks/useMilestones";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { Plus, Calendar, CheckCircle, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function ProjectMilestonesTab({ projectId, isOwner, canApproveUpdateRequests = false }: any) {
  const { data: session } = useSession();
  const { milestones, isLoading, mutate } = useMilestones(projectId);
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);

  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    proofUrl: "",
    isPublic: false,
  });

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    proofUrl: "",
  });

  const [statusForm, setStatusForm] = useState<
    "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED"
  >("NOT_STARTED");

  const currentUserId = Number(session?.user?.id || 0);
  const canManageMilestones = Boolean(canApproveUpdateRequests);

  if (isLoading) return <LoadingSkeleton type="list" />;

  const pendingRequests = (milestones || []).filter(
    (milestone: any) => milestone.updateRequest === "PENDING"
  );

  const canEditMilestone = (milestone: any) =>
    canManageMilestones || Number(milestone.createdById) === currentUserId;

  const resetCreateForm = () => {
    setCreateForm({
      title: "",
      description: "",
      proofUrl: "",
      isPublic: false,
    });
  };

  const openEdit = (milestone: any) => {
    setSelectedMilestone(milestone);
    setEditForm({
      title: milestone.title || "",
      description: milestone.description || "",
      proofUrl: milestone.proofUrl || "",
    });
    setEditOpen(true);
  };

  const openDelete = (milestone: any) => {
    setSelectedMilestone(milestone);
    setDeleteOpen(true);
  };

  const openStatus = (milestone: any) => {
    setSelectedMilestone(milestone);
    setStatusForm(milestone.completionStatus || "NOT_STARTED");
    setStatusOpen(true);
  };

  const handleCreateMilestone = async () => {
    setIsActionLoading(true);
    try {
      const res = await axios.post(`/api/project/milestones/create/${projectId}`, {
        title: createForm.title,
        description: createForm.description,
        proofUrl: createForm.proofUrl,
        isPublic: createForm.isPublic,
      });

      if (res.data.success) {
        toast.success("Milestone created");
        setCreateOpen(false);
        resetCreateForm();
        await mutate();
      } else {
        toast.error(res.data.message || "Failed to create milestone");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create milestone");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditMilestone = async () => {
    if (!selectedMilestone?.id) return;

    setIsActionLoading(true);
    try {
      const res = await axios.put(
        `/api/project/milestones/update/${selectedMilestone.id}`,
        {
          title: editForm.title,
          description: editForm.description,
          proofUrl: editForm.proofUrl,
        }
      );

      if (res.data.success) {
        toast.success("Milestone updated");
        setEditOpen(false);
        setSelectedMilestone(null);
        await mutate();
      } else {
        toast.error(res.data.message || "Failed to update milestone");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update milestone");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteMilestone = async () => {
    if (!selectedMilestone?.id) return;

    setIsActionLoading(true);
    try {
      const res = await axios.delete(
        `/api/project/milestones/delete/${selectedMilestone.id}`
      );

      if (res.data.success) {
        toast.success("Milestone deleted");
        setDeleteOpen(false);
        setSelectedMilestone(null);
        await mutate();
      } else {
        toast.error(res.data.message || "Failed to delete milestone");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete milestone");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateMilestoneStatus = async () => {
    if (!selectedMilestone?.id) return;

    setIsActionLoading(true);
    try {
      const res = await axios.patch(
        `/api/project/milestones/update-completionStatus/${selectedMilestone.id}`,
        {
          completionStatus: statusForm,
        }
      );

      if (res.data.success) {
        if (res.data.milestone?.updateRequest === "PENDING") {
          toast.success("Status update request submitted for approval");
        } else {
          toast.success("Milestone status updated");
        }
        setStatusOpen(false);
        setSelectedMilestone(null);
        await mutate();
      } else {
        toast.error(res.data.message || "Failed to update status");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApproval = async (milestoneId: number, updateRequest: "APPROVED" | "REJECTED") => {
    if (approvingId) return;
    setApprovingId(milestoneId);

    try {
      const res = await axios.put(
        `/api/project/milestones/approve-updateRequest/${milestoneId}`,
        { updateRequest }
      );

      if (res.data.success) {
        toast.success(updateRequest === "APPROVED" ? "Request approved" : "Request rejected");
        await mutate();
      } else {
        toast.error(res.data.message || "Failed to process update request");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to process update request");
    } finally {
      setApprovingId(null);
    }
  };

  const filtered =
    milestones?.filter((m: any) => {
      const status = m.completionStatus || m.status;
      return statusFilter === "all" ? true : status === statusFilter;
    }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-900 text-green-200";
      case "IN_PROGRESS":
        return "bg-blue-900 text-blue-200";
      case "NOT_STARTED":
        return "bg-yellow-900 text-yellow-200";
      case "SKIPPED":
        return "bg-gray-600 text-gray-200";
      default:
        return "bg-gray-700 text-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "Not Started";
      case "IN_PROGRESS":
        return "In Progress";
      case "COMPLETED":
        return "Completed";
      case "SKIPPED":
        return "Skipped";
      default:
        return status.replace(/_/g, " ");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-1">Milestone Workflow</h3>
        <p className="text-sm text-zinc-400">
          Create milestone, edit details, update progress status, and approve/reject pending status
          requests. If you do not have approval rights, your status update is sent as a request.
        </p>
      </div>

      {canApproveUpdateRequests && (
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Pending Update Requests</h3>
            <Badge className="bg-yellow-900 text-yellow-200">
              {pendingRequests.length}
            </Badge>
          </div>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-zinc-400">No pending milestone update requests.</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((milestone: any) => (
                <div key={milestone.id} className="bg-[#18181b] border border-zinc-800 rounded-lg p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-white font-semibold">{milestone.title}</p>
                      <p className="text-xs text-zinc-400">{milestone.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproval(milestone.id, "APPROVED")}
                        disabled={approvingId === milestone.id}
                      >
                        {approvingId === milestone.id ? "Working..." : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-zinc-700"
                        onClick={() => handleApproval(milestone.id, "REJECTED")}
                        disabled={approvingId === milestone.id}
                      >
                        {approvingId === milestone.id ? "Working..." : "Reject"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters and Add Button */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#232326] border border-zinc-800 rounded-lg p-4">
        <div className="flex gap-2">
          {["all", "NOT_STARTED", "IN_PROGRESS", "COMPLETED", "SKIPPED"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={`capitalize ${
                statusFilter === status
                  ? "bg-blue-700 text-white border-blue-700"
                  : "bg-[#1f1f23] text-white border border-zinc-700 hover:bg-[#2a2a2f]"
              }`}
            >
              {status === "IN_PROGRESS"
                ? "In Progress"
                : status === "NOT_STARTED"
                ? "Not Started"
                : status === "SKIPPED"
                ? "Skipped"
                : status}
            </Button>
          ))}
        </div>
        {canManageMilestones && (
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Milestone
          </Button>
        )}
      </div>

      {/* Milestones List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No milestones"
          description={
            statusFilter === "all"
              ? "Start by creating your first milestone"
              : `No ${statusFilter.replace(/_/g, " ")} milestones yet`
          }
          actionLabel={isOwner ? "Create Milestone" : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((milestone: any) => (
            <div
              key={milestone.id}
              className="bg-[#232326] border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">
                      {milestone.title}
                    </h3>
                    <Badge
                      className={getStatusColor(
                        milestone.completionStatus || milestone.status
                      )}
                    >
                      {getStatusLabel(
                        milestone.completionStatus || milestone.status
                      )}
                    </Badge>
                    {milestone.updateRequest === "PENDING" && (
                      <Badge className="bg-yellow-900 text-yellow-200">Pending Approval</Badge>
                    )}
                  </div>
                  <p className="text-[#A1A1AA] mb-3">
                    {milestone.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[#A1A1AA]">
                    <Calendar className="h-4 w-4" />
                    {new Date(milestone.createdAt).toLocaleDateString()}
                    <span>By {milestone.createdBy?.name || "Unknown"}</span>
                    {milestone.proofUrl && (
                      <a
                        href={milestone.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Proof link
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {milestone.completionStatus === "COMPLETED" && (
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-zinc-700 bg-[#1f1f23] text-white hover:bg-[#2a2a2f]"
                    onClick={() => openStatus(milestone)}
                  >
                    Update Status
                  </Button>
                  {canEditMilestone(milestone) && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-zinc-700 bg-[#1f1f23] text-white hover:bg-[#2a2a2f]"
                        onClick={() => openEdit(milestone)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-800 bg-red-900/20 text-red-300 hover:bg-red-900/40"
                        onClick={() => openDelete(milestone)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Milestone</DialogTitle>
            <DialogDescription>
              Add milestone details and optional proof link/public visibility.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 text-white">Title</Label>
              <Input
                value={createForm.title}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                className="bg-[#18181b] border-zinc-700 text-white"
              />
            </div>
            <div>
              <Label className="mb-2 text-white">Description</Label>
              <Textarea
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="bg-[#18181b] border-zinc-700 text-white"
              />
            </div>
            <div>
              <Label className="mb-2 text-white">Proof URL (optional)</Label>
              <Input
                value={createForm.proofUrl}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, proofUrl: e.target.value }))}
                className="bg-[#18181b] border-zinc-700 text-white"
                placeholder="https://..."
              />
            </div>
            <div>
              <Label className="mb-2 text-white">Visibility</Label>
              <Select
                value={createForm.isPublic ? "public" : "private"}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({ ...prev, isPublic: value === "public" }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-zinc-700 bg-[#1f1f23] text-white hover:bg-[#2a2a2f]"
              onClick={() => {
                setCreateOpen(false);
                resetCreateForm();
              }}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateMilestone} disabled={isActionLoading}>
              {isActionLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Milestone</DialogTitle>
            <DialogDescription>
              Update title, description, and proof URL.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 text-white">Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                className="bg-[#18181b] border-zinc-700 text-white"
              />
            </div>
            <div>
              <Label className="mb-2 text-white">Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="bg-[#18181b] border-zinc-700 text-white"
              />
            </div>
            <div>
              <Label className="mb-2 text-white">Proof URL (optional)</Label>
              <Input
                value={editForm.proofUrl}
                onChange={(e) => setEditForm((prev) => ({ ...prev, proofUrl: e.target.value }))}
                className="bg-[#18181b] border-zinc-700 text-white"
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-zinc-700 bg-[#1f1f23] text-white hover:bg-[#2a2a2f]"
              onClick={() => {
                setEditOpen(false);
                setSelectedMilestone(null);
              }}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEditMilestone} disabled={isActionLoading}>
              {isActionLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Milestone Status</DialogTitle>
            <DialogDescription>
              Change progress state. If you do not have approval rights, this becomes a pending
              request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 text-white">Completion Status</Label>
              <Select value={statusForm} onValueChange={(value: any) => setStatusForm(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="SKIPPED">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-zinc-700 bg-[#1f1f23] text-white hover:bg-[#2a2a2f]"
              onClick={() => {
                setStatusOpen(false);
                setSelectedMilestone(null);
              }}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateMilestoneStatus} disabled={isActionLoading}>
              {isActionLoading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Milestone</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Delete milestone "{selectedMilestone?.title || ""}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-zinc-700 bg-[#1f1f23] text-white hover:bg-[#2a2a2f]"
              onClick={() => {
                setDeleteOpen(false);
                setSelectedMilestone(null);
              }}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMilestone}
              disabled={isActionLoading}
            >
              {isActionLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
