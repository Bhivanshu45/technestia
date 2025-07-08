"use client";

import AuthImage from "@/components/auth/AuthImage";
import SignInForm from "@/components/auth/SignInForm";

export default function SignInPage() {
  

  return (
    <div className="w-full min-h-[275px] flex md:flex-row flex-col text-white bg-[#1E1E20] border-2 border-[#52525B] rounded-2xl">
      <div className="w-full h-full flex-1 overflow-hidden">
        <AuthImage formType={"signIn"} />
      </div>
      <div className="w-full h-full flex-1 flex items-center justify-center p-4">
        <SignInForm />
      </div>
    </div>
  );
}
