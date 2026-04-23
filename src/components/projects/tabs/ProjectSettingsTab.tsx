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
import { Trash2, AlertCircle, Pencil } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

type ProjectStatus = "IDEA" | "IN_PROGRESS" | "COMPLETED";

const OUTLINE_DARK_BUTTON = "border-zinc-700 bg-[#18181b] text-white hover:bg-zinc-800";

export default function ProjectSettingsTab({ project, onUpdate, isOwner = false }: any) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [generalData, setGeneralData] = useState({
    title: project.title,
    description: project.description,
    techStackText: (project.techStack || []).join(", "),
    tagsText: (project.tags || []).join(", "),
  });

  const [socialData, setSocialData] = useState({
    githubUrl: project.githubUrl || "",
    liveDemoUrl: project.liveDemoUrl || "",
  });

  const [projectSettingsData, setProjectSettingsData] = useState({
    status: (project.status || "IDEA") as ProjectStatus,
    isPublic: Boolean(project.isPublic),
  });

  const [selectedScreenshots, setSelectedScreenshots] = useState<File[]>([]);
  const [editingSection, setEditingSection] = useState<
    "general" | "links" | "screenshots" | "project" | null
  >(null);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setGeneralData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e: any) => {
    const { name, value } = e.target;
    setSocialData((prev) => ({ ...prev, [name]: value }));
  };

  const parseCsv = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSaveGeneral = async () => {
    setIsLoading(true);
    try {
      await axios.patch(`/api/project/update/general/${project.id}`, {
        title: generalData.title,
        description: generalData.description,
        techStack: parseCsv(generalData.techStackText),
        tags: parseCsv(generalData.tagsText),
      });
      toast.success("General details updated");
      setEditingSection(null);
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update project details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSocialLinks = async () => {
    setIsLoading(true);
    try {
      await axios.patch(`/api/project/update/social-links/${project.id}`, {
        githubUrl: socialData.githubUrl || "",
        liveDemoUrl: socialData.liveDemoUrl || "",
      });
      toast.success("Social links updated");
      setEditingSection(null);
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update social links");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await axios.put(`/api/project/update/settings/${project.id}`, {
        status: projectSettingsData.status,
        isPublic: projectSettingsData.isPublic,
      });
      toast.success("Project settings updated");
      setEditingSection(null);
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update project settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveScreenshots = async () => {
    if (selectedScreenshots.length === 0) {
      toast.error("Please select at least one screenshot");
      return;
    }

    setIsLoading(true);
    try {
      const screenshotsPayload = await Promise.all(
        selectedScreenshots.map(
          (file) =>
            new Promise<{ name: string; type: string; buffer: string }>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = String(reader.result || "");
                const buffer = base64.includes(",") ? base64.split(",")[1] : base64;
                resolve({
                  name: file.name,
                  type: file.type,
                  buffer,
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );

      await axios.patch(`/api/project/update/screenshots/${project.id}`, {
        screenshots: screenshotsPayload,
      });

      toast.success("Screenshots updated");
      setSelectedScreenshots([]);
      setEditingSection(null);
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update screenshots");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await axios.delete(`/api/project/delete/${project.id}`);
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
      <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-white">General</h2>
          {editingSection !== "general" && (
            <Button
              variant="outline"
              size="sm"
              className={OUTLINE_DARK_BUTTON}
              onClick={() => setEditingSection("general")}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>

        {editingSection === "general" ? (
          <div className="space-y-4">
          <div>
            <Label className="text-white mb-2">Project Title</Label>
            <Input
              name="title"
              value={generalData.title}
              onChange={handleInputChange}
              className="bg-[#18181b] border-zinc-800 text-white"
            />
          </div>

          <div>
            <Label className="text-white mb-2">Description</Label>
            <Textarea
              name="description"
              value={generalData.description}
              onChange={handleInputChange}
              className="bg-[#18181b] border-zinc-800 text-white min-h-24"
            />
          </div>

          <div>
            <Label className="text-white mb-2">Tech Stack (comma separated)</Label>
            <Input
              name="techStackText"
              value={generalData.techStackText}
              onChange={handleInputChange}
              className="bg-[#18181b] border-zinc-800 text-white"
            />
          </div>

          <div>
            <Label className="text-white mb-2">Tags (comma separated)</Label>
            <Input
              name="tagsText"
              value={generalData.tagsText}
              onChange={handleInputChange}
              className="bg-[#18181b] border-zinc-800 text-white"
            />
          </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveGeneral} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save General"}
              </Button>
              <Button
                variant="outline"
                className={OUTLINE_DARK_BUTTON}
                disabled={isLoading}
                onClick={() => {
                  setGeneralData({
                    title: project.title,
                    description: project.description,
                    techStackText: (project.techStack || []).join(", "),
                    tagsText: (project.tags || []).join(", "),
                  });
                  setEditingSection(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <p className="text-zinc-300">
              <span className="text-zinc-400">Title:</span> {project.title}
            </p>
            <p className="text-zinc-300">
              <span className="text-zinc-400">Description:</span> {project.description}
            </p>
            <p className="text-zinc-300">
              <span className="text-zinc-400">Tech Stack:</span> {(project.techStack || []).join(", ") || "Not set"}
            </p>
            <p className="text-zinc-300">
              <span className="text-zinc-400">Tags:</span> {(project.tags || []).join(", ") || "Not set"}
            </p>
          </div>
        )}
      </div>

      <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-white">Social Links</h2>
          {editingSection !== "links" && (
            <Button
              variant="outline"
              size="sm"
              className={OUTLINE_DARK_BUTTON}
              onClick={() => setEditingSection("links")}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>

        {editingSection === "links" ? (
          <>
            <div>
          <Label className="text-white mb-2">GitHub URL</Label>
          <Input
            name="githubUrl"
            value={socialData.githubUrl}
            onChange={handleSocialChange}
            className="bg-[#18181b] border-zinc-800 text-white"
          />
        </div>
            <div>
          <Label className="text-white mb-2">Live Demo URL</Label>
          <Input
            name="liveDemoUrl"
            value={socialData.liveDemoUrl}
            onChange={handleSocialChange}
            className="bg-[#18181b] border-zinc-800 text-white"
          />
        </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveSocialLinks} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Links"}
              </Button>
              <Button
                variant="outline"
                className={OUTLINE_DARK_BUTTON}
                disabled={isLoading}
                onClick={() => {
                  setSocialData({
                    githubUrl: project.githubUrl || "",
                    liveDemoUrl: project.liveDemoUrl || "",
                  });
                  setEditingSection(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-2 text-sm">
            <p className="text-zinc-300 break-all">
              <span className="text-zinc-400">GitHub:</span> {project.githubUrl || "Not set"}
            </p>
            <p className="text-zinc-300 break-all">
              <span className="text-zinc-400">Live Demo:</span> {project.liveDemoUrl || "Not set"}
            </p>
          </div>
        )}
      </div>

      <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-white">Screenshots</h2>
          {editingSection !== "screenshots" && (
            <Button
              variant="outline"
              size="sm"
              className={OUTLINE_DARK_BUTTON}
              onClick={() => setEditingSection("screenshots")}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>

        {editingSection === "screenshots" ? (
          <>
            <Input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => setSelectedScreenshots(Array.from(e.target.files || []))}
          className="bg-[#18181b] border-zinc-800 text-white"
        />
            {selectedScreenshots.length > 0 && (
              <p className="text-sm text-zinc-400">{selectedScreenshots.length} file(s) selected</p>
            )}
            <div className="flex gap-2">
              <Button onClick={handleSaveScreenshots} disabled={isLoading || selectedScreenshots.length === 0}>
                {isLoading ? "Uploading..." : "Upload Screenshots"}
              </Button>
              <Button
                variant="outline"
                className={OUTLINE_DARK_BUTTON}
                disabled={isLoading}
                onClick={() => {
                  setSelectedScreenshots([]);
                  setEditingSection(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-300">
            Current media files: {(project.screenshots || []).length}
          </p>
        )}
      </div>

      <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-white">Project Settings</h2>
          {editingSection !== "project" && (
            <Button
              variant="outline"
              size="sm"
              className={OUTLINE_DARK_BUTTON}
              onClick={() => setEditingSection("project")}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>

        {editingSection === "project" ? (
          <>
            <div>
          <Label className="text-white mb-2">Status</Label>
          <select
            value={projectSettingsData.status}
            onChange={(e) =>
              setProjectSettingsData((prev) => ({
                ...prev,
                status: e.target.value as ProjectStatus,
              }))
            }
            className="w-full bg-[#18181b] border border-zinc-800 rounded-md px-3 py-2 text-white"
          >
            <option value="IDEA">Idea</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
            <div>
          <Label className="text-white mb-2">Visibility</Label>
          <select
            value={projectSettingsData.isPublic ? "public" : "private"}
            onChange={(e) =>
              setProjectSettingsData((prev) => ({
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
              <Button onClick={handleSaveSettings} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
              <Button
                variant="outline"
                className={OUTLINE_DARK_BUTTON}
                disabled={isLoading}
                onClick={() => {
                  setProjectSettingsData({
                    status: (project.status || "IDEA") as ProjectStatus,
                    isPublic: Boolean(project.isPublic),
                  });
                  setEditingSection(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-2 text-sm">
            <p className="text-zinc-300">
              <span className="text-zinc-400">Status:</span> {project.status}
            </p>
            <p className="text-zinc-300">
              <span className="text-zinc-400">Visibility:</span> {project.isPublic ? "Public" : "Private"}
            </p>
          </div>
        )}
      </div>

      <Separator className="bg-zinc-800" />

      {isOwner && (
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
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className={OUTLINE_DARK_BUTTON}
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
