"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { signUpSchema } from "@/validations/authSchemas/signUpSchema";
import OAuthButtons from "./OAuthButtons";
import axios from "axios";
import { AxiosError } from "axios";
import { useDebounceCallback } from "usehooks-ts";
import { ApiResponse } from "@/types/ApiResponse";

const SignUpForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const debouncedUsername = useDebounceCallback(setUsername, 300);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/auth/sign-up", {
        name: data.name,
        email: data.email,
        username: data.username,
        password: data.password,
      });

      console.log("Sign up Response : ", response.data);
      if (response.data.success) {
        toast.success("Account created successfully! Redirecting...");
        form.reset();
        setTimeout(() => {
          router.push(`/auth/verify-otp/${data.email}`);
        }, 1000);
      } else {
        toast.error(
          response.data.message || "Failed to create account. Please try again."
        );
      }
    } catch (error) {
      toast.error("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isUsernameUnique = async () => {
      if (username) {
        setIsCheckingUsername(true);
        setUsernameMessage("");
        try {
          const response = await axios.get(
            `/api/profile/username-uniqueness?username=${username}`
          );

          setUsernameMessage(response.data.message);
          if (!response.data.success) {
            throw new Error(response.data.message);
          }
        } catch (error) {
          const axiosError = error as AxiosError<ApiResponse>;
          setUsernameMessage(
            axiosError.response?.data.message ||
              "Failed to check username uniqueness."
          );
        } finally {
          setIsCheckingUsername(false);
        }
      }
    };

    isUsernameUnique();
  }, [username]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-[#f4f4f5e4] p-2 gap-4">
      {/* Form Header*/}
      <div className="w-full text-center flex flex-col items-center justify-center gap-2">
        <img
          src="/android-chrome-192x192.png"
          alt="Technestia Logo"
          className="md:w-10 w-8 rounded-full"
        />
        <h1 className="text-xl sm:text-2xl font-bold">
          Welcome to Technestia !
        </h1>
        <p className="text-sm italic text-[#A1A1AA]">
          Sign up to Explore, Build, Grow.
        </p>
      </div>

      {/* OAuth Buttons */}
      <OAuthButtons />

      <div className="flex items-center justify-center gap-4 w-[75%]">
        <div className="h-px w-full bg-gray-600" />
        <span className="text-sm text-gray-500">or</span>
        <div className="h-px w-full bg-gray-600" />
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5 w-[75%]"
        >
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    autoFocus
                    placeholder="Enter your name"
                    {...field}
                    className="bg-[#1f1f22] border border-zinc-600 text-white placeholder:text-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="w-full flex md:flex-row flex-col justify-between gap-4">
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder="Enter your email"
                      {...field}
                      className="bg-[#1f1f22] border border-zinc-600 text-white placeholder:text-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="password"
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
          </div>

          <FormField
            name="username"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    autoFocus
                    placeholder="Enter a unique username"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      debouncedUsername(e.target.value);
                    }}
                    className="bg-[#1f1f22] border border-zinc-600 text-white placeholder:text-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                  />
                </FormControl>
                {isCheckingUsername && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {usernameMessage && (
                  <p
                    className={`text-sm mt-1 ${
                      usernameMessage.toLowerCase().includes("available")
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {usernameMessage}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            variant="secondary"
            disabled={loading || form.formState.isSubmitting}
            aria-busy={loading}
            className="w-full cursor-pointer"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </Form>

      <div className="w-full text-center flex flex-col items-center justify-center gap-2">
        <p className="text-sm font-semibold">
          Already have an account?{" "}
          <a
            href="/auth/sign-in"
            className="text-blue-500 font-medium hover:underline"
          >
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUpForm;
