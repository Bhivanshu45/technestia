'use client';
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const VerifyOtp = ({ params }: { params: { email: string } }) => {
  const { email } = params;
  const decodedEmail = decodeURIComponent(email);
  const router = useRouter();
  const [loading,setLoading] = useState(false);
  const [resendLoading,setResendLoading] = useState(false);
  const [otp,setOtp] = useState('');
  const [resendMessage,setResendMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    if (!otp) {
      toast.error('Enter a valid OTP');
      return;
    }
    try{
      const response = await axios.post('/api/auth/verify-otp',{
        email: decodedEmail,
        otp: otp
      })

      if(response.data.success){
        toast.success("Email Verified successfully. Redirecting...");
        setOtp('');
        setTimeout(() => {
          router.push('/auth/sign-in')
        },1000)
      }else{
        toast.error(response.data?.message || "Invalid request");
      }

    }catch(error: any){
      toast.error("Network error. Please try again later.");
    }finally{
      setLoading(false);
    }
  }

  const handleResend = async () => {

    setResendLoading(true);
    try {
      const response = await axios.post("/api/auth/resend-otp", {
        email: decodedEmail,
      });

      setResendMessage(response?.data?.message || "OTP sent successfully");
      toast.success(response?.data?.message || "OTP sent successfully");

    } catch (error) {
      setResendMessage("Failed to resend OTP. Please try again after some time.");
      toast.error("Failed to resend OTP. Please try again after some time.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-[95%] md:max-w-[450px] min-h-[60vh] flex items-center justify-center p-6 text-white bg-[#1E1E20] border-2 border-[#52525B] rounded-2xl">
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="w-full text-center flex flex-col items-center justify-center gap-2">
          <img
            src="/android-chrome-192x192.png"
            alt="Technestia Logo"
            className="md:w-12 w-8 rounded-full"
          />
          <h1 className="text-2xl font-bold">Verify OTP</h1>
          <p className="text-sm text-gray-400">
            Please enter the OTP sent to your email {decodedEmail} to verify
            your account.
          </p>
        </div>
        <p className="relative text-sm text-right">
          <button
            type="button"
            onClick={handleResend}
            aria-busy={resendLoading}
            className="text-blue-500 hover:underline"
          >
            {resendLoading ? "Sending..." : "Resend OTP"}
          </button>
        </p>

        {resendMessage && (
          <p className="text-green-500 text-sm">{resendMessage}</p>
        )}

        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col items-center justify-center gap-4"
        >
          <InputOTP
            maxLength={6}
            minLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            value={otp}
            className="text-lg font-semibold"
            onChange={(value) => setOtp(value)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <Button
            type="submit"
            variant="secondary"
            disabled={loading}
            className="w-full cursor-pointer"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Verify"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
