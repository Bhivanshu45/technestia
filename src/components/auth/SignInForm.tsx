'use client';
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
import { useState } from "react";
import { signIn } from "next-auth/react";
import { signInSchema } from "@/validations/authSchemas/signInSchema";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import OAuthButtons from "./OAuthButtons";

const SignInForm = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<z.infer<typeof signInSchema>>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            identifier: "",
            password: ""
        }
    })

    const onSubmit = async(data : z.infer<typeof signInSchema>) => {
        setLoading(true);
        try{
            const response = await signIn("credentials",{
                identifier: data.identifier,
                password: data.password,
                redirect: false,
            })

            if (response?.ok && !response.error) {
              toast.success("Login successful! Redirecting...");
              form.reset();
              setTimeout(() => {
                router.push("/");
              }, 1000);
            }else{
                toast.error(response?.error || "Invalid credentials");
            }
        }catch(error){
            toast.error("Network error. Please try again later.");
        }finally{
            setLoading(false);
        }
    }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-[#f4f4f5e4] p-2 gap-4">
      {/* Form Header*/}
      <div className="w-full text-center flex flex-col items-center justify-center gap-2">
        <img
          src="/android-chrome-192x192.png"
          alt="Technestia Logo"
          className="md:w-12 w-8 rounded-full"
        />
        <h1 className="text-xl sm:text-2xl font-bold">Welcome Explorer !</h1>
        <p className="text-sm italic text-[#A1A1AA]">
          Sign-in to Collaborate, Build, Grow?
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
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email/Username</FormLabel>
                <FormControl>
                  <Input
                    autoFocus
                    placeholder="Enter email or username"
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
          <p className="relative text-sm text-right">
            <a
              href="/auth/forgot-password"
              className="text-blue-500 hover:underline"
            >
              Forgot Password?
            </a>
          </p>

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
              "Sign in"
            )}
          </Button>
        </form>
      </Form>

      <div className="w-full text-center flex flex-col items-center justify-center gap-2">
        <p className="text-sm font-semibold">
          Don't have an account?{" "}
          <a
            href="/auth/sign-up"
            className="text-blue-500 font-medium hover:underline"
          >
            Create Account
          </a>
        </p>
      </div>
    </div>
  );
}

export default SignInForm;
