"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { toast } from "sonner";
import { changePasswordSchema, passValidation } from "@/validations/profileSchemas/changePasswordSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const setPasswordSchema = z.object({
  newPassword: passValidation,
});

type ChangePasswordData = z.infer<typeof changePasswordSchema>;
type SetPasswordData = z.infer<typeof setPasswordSchema>;

export default function ChangePasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSetting, setIsSetting] = useState(false);

  const changeForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const setForm = useForm<SetPasswordData>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      newPassword: "",
    },
  });

  const handleChangePassword = async (data: ChangePasswordData) => {
    setIsSubmitting(true);
    try {
      const res = await axios.put("/api/profile/update/password", data);
      if (res.data.success) {
        toast.success("Password changed successfully");
        changeForm.reset();
      } else {
        toast.error(res.data.message || "Failed to change password");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPassword = async (data: SetPasswordData) => {
    setIsSetting(true);
    try {
      const res = await axios.put("/api/profile/set-password", data);
      if (res.data.success) {
        toast.success("Password set successfully");
        setForm.reset();
      } else {
        toast.error(res.data.message || "Failed to set password");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to set password");
    } finally {
      setIsSetting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Change Password</h1>
        <p className="text-[#A1A1AA] text-sm">Keep your account secure</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
          <Form {...changeForm}>
            <form onSubmit={changeForm.handleSubmit(handleChangePassword)} className="space-y-4">
              <FormField
                control={changeForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={changeForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Set Password (OAuth users)</h2>
          <p className="text-xs text-[#A1A1AA] mb-4">
            If your account was created with Google or GitHub, set a password here.
          </p>
          <Form {...setForm}>
            <form onSubmit={setForm.handleSubmit(handleSetPassword)} className="space-y-4">
              <FormField
                control={setForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSetting} className="w-full">
                {isSetting ? "Setting..." : "Set Password"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
