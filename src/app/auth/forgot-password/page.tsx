"use client";

import {
  FormItem,
  FormField,
  FormControl,
  FormLabel,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPasswordSchema } from "@/validations/authSchemas/forgotPasswordSchema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const ForgotPassword = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/auth/forgot-password", {
        email: data.email,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setEmailSent(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[95%] md:max-w-[450px] min-h-[60vh] flex items-center justify-center p-6 text-white bg-[#1E1E20] border-2 border-[#52525B] rounded-2xl">
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="w-[90%] text-center flex flex-col items-center justify-center gap-2">
          <img
            src="/android-chrome-192x192.png"
            alt="Technestia Logo"
            className="md:w-12 w-8 rounded-full"
          />
          <h1 className="text-2xl font-bold">Forgot Password</h1>

          {!emailSent && (
            <p className="text-sm text-gray-400">
              Please enter your registered email to get reset password link on
              your email
            </p>
          )}
        </div>

        {emailSent ? (
          <div className="w-full text-green-600 text-center">
            Please check your email for the reset password link. You will be
            redirected to the login page shortly.
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 w-[85%]"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        autoFocus
                        placeholder="Enter email"
                        {...field}
                        className="bg-[#1f1f22] border border-zinc-600 text-white placeholder:text-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                variant="secondary"
                disabled={loading}
                className="w-full cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Reset Link"
                )}
              </Button>
            </form>
          </Form>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            setTimeout(() => {
              router.push("/auth/sign-in");
            }, 1500);
          }}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Button>
      </div>
    </div>
  );
};

export default ForgotPassword;
