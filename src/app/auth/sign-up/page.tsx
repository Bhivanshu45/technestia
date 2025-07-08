"use client";

import AuthImage from "@/components/auth/AuthImage";
import SignUpForm from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <div className="w-full md:max-h-[85vh] min-h-[275px] flex md:flex-row flex-col text-white bg-[#1E1E20] border-2 border-[#52525B] rounded-2xl overflow-hidden">
      <div className="w-full h-full flex-1 overflow-hidden">
        <AuthImage formType={"signUp"} />
      </div>
      <div className="w-full h-full flex-1 flex items-center justify-center p-4">
        <SignUpForm />
      </div>
    </div>
  );
}
