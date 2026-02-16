"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, AlertCircle } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export default function ProjectSettingsTab({ project, onUpdate }: any) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description,
    isPublic: project.isPublic,
    techStack: project.techStack || [],
  });

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await axios.put(`/api/project/${project.id}`, formData);
      toast.success("Project updated successfully!");
      onUpdate();
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await axios.delete(`/api/project/${project.id}`);
      toast.success("Project deleted successfully!");
      router.push("/projects");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Edit Section */}
      <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Edit Project</h2>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Edit Details
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label className="text-white mb-2">Project Title</Label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="bg-[#18181b] border-zinc-800 text-white"
              />
            </div>

            <div>
              <Label className="text-white mb-2">Description</Label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="bg-[#18181b] border-zinc-800 text-white min-h-24"
              />
            </div>

            <div>
              <Label className="text-white mb-2">Visibility</Label>
              <select
                name="isPublic"
                value={formData.isPublic ? "public" : "private"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isPublic: e.target.value === "public",
                  }))
                }
                className="w-full bg-[#18181b] border border-zinc-800 rounded-md px-3 py-2 text-white"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-[#A1A1AA]">
            <div>
              <p className="text-sm text-zinc-400">Title</p>
              <p className="text-white font-semibold">{formData.title}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Description</p>
              <p className="text-white">{formData.description}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Visibility</p>
              <p className="text-white capitalize">{formData.isPublic ? "Public" : "Private"}</p>
            </div>
          </div>
        )}
      </div>

      <Separator className="bg-zinc-800" />

      {/* Danger Zone */}
      <div className="bg-red-900/20 border border-red-900 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h2 className="text-2xl font-bold text-red-500">Danger Zone</h2>
        </div>

        <p className="text-[#A1A1AA] mb-4">
          Once you delete a project, there is no going back. Please be certain.
        </p>

        <Button
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete Project
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
