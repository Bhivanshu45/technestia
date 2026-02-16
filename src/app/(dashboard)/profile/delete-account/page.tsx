"use client";

import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DeleteAccountPage() {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setIsDeleting(true);
    try {
      const res = await axios.delete("/api/profile/remove-account");
      if (res.data.success) {
        toast.success("Account deleted successfully");
        await signOut({ callbackUrl: "/auth/sign-in" });
      } else {
        toast.error(res.data.message || "Failed to delete account");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Delete Account</h1>
        <p className="text-[#A1A1AA] text-sm">This action is permanent and cannot be undone</p>
      </div>

      <div className="bg-red-900/20 border border-red-900 rounded-lg p-6 space-y-4">
        <p className="text-sm text-red-200">
          Deleting your account will permanently remove your data, projects, and collaborations.
        </p>
        <div>
          <label className="text-sm text-[#A1A1AA]">Type DELETE to confirm</label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="mt-2"
          />
        </div>
        <Button
          variant="destructive"
          disabled={confirmText !== "DELETE" || isDeleting}
          onClick={handleDelete}
        >
          {isDeleting ? "Deleting..." : "Delete My Account"}
        </Button>
      </div>
    </div>
  );
}
