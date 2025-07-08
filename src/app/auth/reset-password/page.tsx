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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye,EyeOff } from "lucide-react";

const formSchema = z.object({
  newPassword: z.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/, {
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
});

const ResetPassword = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const token = searchParams.get('token');

    const [loading,setLoading] = useState(false);
    const [showPassword,setShowPassword] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        newPassword: "",
      },
    });

    const onSubmit = async(data: z.infer<typeof formSchema>) => {
        if (!token || !email) {
          toast.error("Invalid or expired reset link.");
          return;
        }
      
        setLoading(true);
        try{
            const response = await axios.post("/api/auth/reset-password",{
                email: email,
                token: token,
                newPassword: data.newPassword
            })

            if(response.data.success){
                toast.success(response.data.message|| "Password reset successfully.Redirecting...")
                setTimeout(() => {
                    router.push('/auth/sign-in')
                },1500);
            }

        }catch(error: any){
            toast.error(error.response?.data?.message || "Password reset failed");
        }finally{
            setLoading(false)
        }
    }


    return (
      <div className="w-[95%] md:max-w-[450px] min-h-[60vh] flex items-center justify-center p-6 text-white bg-[#1E1E20] border-2 border-[#52525B] rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="w-[90%] text-center flex flex-col items-center justify-center gap-2">
            <img
              src="/android-chrome-192x192.png"
              alt="Technestia Logo"
              className="md:w-12 w-8 rounded-full"
            />
            <h1 className="text-2xl font-bold">Reset Password</h1>

            {token && email && (
              <p className="text-sm text-gray-400">
                Resetting password for {email}
              </p>
            )}
          </div>

          {token && email ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 w-full"
              >
                <FormField
                  name="newPassword"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            autoFocus
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...field}
                            className="bg-[#1f1f22] border border-zinc-600 text-white placeholder:text-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition pr-10"
                          />
                          <div
                            className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4 text-zinc-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                        </div>
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
                    "Reset Password"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <p className="w-[85%] text-center text-red-500 font-semibold text-xl">
              Invalid Reset Link
            </p>
          )}

          <Button
            variant="ghost"
            onClick={() => {
                setTimeout(() => {
                    router.push("/auth/sign-in");
                },1500)
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

export default ResetPassword;
