"use client";

import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChangeAvatarPage() {
  const { user, isLoading, mutate } = useProfile();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (isLoading) return <LoadingSkeleton type="detail" />;

  const validateFile = (f: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(f.type)) return "Only JPG, PNG, or WEBP files are allowed";
    if (f.size > 5 * 1024 * 1024) return "File size exceeds 5MB";
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const error = validateFile(selected);
    if (error) {
      toast.error(error);
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.put("/api/profile/update/image", formData);
      if (res.data.success) {
        toast.success("Avatar updated successfully");
        mutate();
        setFile(null);
        setPreview(null);
      } else {
        toast.error(res.data.message || "Failed to update avatar");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    setIsUploading(true);
    try {
      const res = await axios.delete("/api/profile/delete-image");
      if (res.data.success) {
        toast.success("Avatar removed successfully");
        mutate();
        setPreview(null);
        setFile(null);
      } else {
        toast.error(res.data.message || "Failed to remove avatar");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove avatar");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Change Avatar</h1>
        <p className="text-[#A1A1AA] text-sm">Update your profile picture</p>
      </div>

      <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-4">
          <img
            src={preview || user?.image || "/default-avatar.png"}
            alt="Profile"
            className="h-20 w-20 rounded-full border border-zinc-700 object-cover"
          />
          <div>
            <p className="text-sm text-[#A1A1AA]">Recommended: 400x400px</p>
            <p className="text-xs text-[#A1A1AA]">JPG, PNG, WEBP, max 5MB</p>
          </div>
        </div>

        <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? "Uploading..." : "Upload New Avatar"}
          </Button>
          {user?.image && (
            <Button variant="destructive" onClick={handleDelete} disabled={isUploading}>
              Remove Avatar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
