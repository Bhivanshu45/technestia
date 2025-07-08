'use client';

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

const OAuthButtons = () => {

    const [oAuthLoading, setOAuthLoading] = useState(false);

    const handleOAuthLogin = async (provider: "google" | "github") => {
      setOAuthLoading(true);
      try {
        await signIn(provider, {
          callbackUrl: "/",
        });
      } catch (error) {
        toast.error("OAuth Sign-in failed. Please try again later.");
      } finally {
        setOAuthLoading(false);
      }
    };
  return (
    <div className="flex md:flex-row flex-col justify-between w-[75%] gap-4">
      <Button
        variant="ghost"
        disabled={oAuthLoading}
        onClick={() => handleOAuthLogin("google")}
        className="md:w-[45%] overflow-hidden border-2 border-zinc-500"
      >
        <FcGoogle size={20} />
        Continue with Google
      </Button>
      <Button
        variant="ghost"
        disabled={oAuthLoading}
        onClick={() => handleOAuthLogin("github")}
        className="md:w-[45%] overflow-hidden border-2 border-zinc-500"
      >
        <FaGithub size={20} />
        Continue with GitHub
      </Button>
    </div>
  );
}

export default OAuthButtons
