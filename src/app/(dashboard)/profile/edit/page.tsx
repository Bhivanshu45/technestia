"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { toast } from "sonner";
import { updateProfileSchema } from "@/validations/profileSchemas/updateProfileSchema";
import { useProfile } from "@/hooks/useProfile";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type FormData = z.infer<typeof updateProfileSchema>;

export default function EditProfilePage() {
  const router = useRouter();
  const { user, isLoading, mutate } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const form = useForm<FormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: "",
      bio: "",
      githubUrl: "",
      linkedinUrl: "",
      websiteUrl: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        bio: user.bio || "",
        githubUrl: user.githubUrl || "",
        linkedinUrl: user.linkedinUrl || "",
        websiteUrl: user.websiteUrl || "",
      });
      setUsername(user.username || "");
    }
  }, [user, form]);

  const checkUsername = async () => {
    if (!username.trim()) return;
    setUsernameStatus("checking");
    try {
      const res = await axios.get(`/api/profile/username-uniqueness?username=${username}`);
      if (res.data.success) {
        setUsernameStatus("available");
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setUsernameStatus("taken");
      } else {
        setUsernameStatus("idle");
      }
    }
  };

  const updateUsername = async () => {
    if (!username.trim()) return;
    try {
      const res = await axios.put("/api/profile/update/username", { username });
      if (res.data.success) {
        toast.success("Username updated successfully");
        mutate();
        setUsernameStatus("available");
      } else {
        toast.error(res.data.message || "Failed to update username");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update username");
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await axios.put("/api/profile/update/my-profile", data);
      if (response.data.success) {
        toast.success("Profile updated successfully");
        mutate();
        router.push("/profile");
      } else {
        toast.error(response.data.message || "Failed to update profile");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSkeleton type="detail" />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Edit Profile</h1>
        <p className="text-[#A1A1AA] text-sm">Update your personal information</p>
      </div>

      <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell something about yourself"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="githubUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourwebsite.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-3 border-t border-zinc-800">
              <FormLabel>Username</FormLabel>
              <div className="flex flex-col md:flex-row gap-3 mt-2">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={checkUsername}>
                    Check
                  </Button>
                  <Button type="button" onClick={updateUsername}>
                    Update
                  </Button>
                </div>
              </div>
              {usernameStatus === "available" && (
                <p className="text-xs text-green-400 mt-1">Username is available</p>
              )}
              {usernameStatus === "taken" && (
                <p className="text-xs text-red-400 mt-1">Username already taken</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
