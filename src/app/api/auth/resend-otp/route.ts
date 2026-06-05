import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { z } from "zod";
import { sendEmail } from "@/helpers/sendEmail";
import { VerifyEmailPayload } from "@/types/emailPayload";
import { getIP } from "@/utils/getIP";
import { checkRateLimit } from "@/lib/rateLimit";
import logger from "@/lib/logger";

const resendOtpSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

const RESEND_COOLDOWN_MINUTES = 1;

export const POST = async (req: Request) => {
  try {
    const ip = getIP(req);
    logger.info("auth.resend_otp.request_received", { ip });
    // check rate limit based on IP address
    const key = `resend-otp:${ip}`;
    const rateLimitRes = await checkRateLimit(key);
    if (!rateLimitRes.success) {
      logger.warn("auth.resend_otp.rate_limited", { ip });
      return NextResponse.json(
        {
          success: false,
          message: "Too many requests. Please try again later.",
        },
        { status: 429 },
      );
    }
    
    const body = await req.json();

    // validation
    const parsedData = resendOtpSchema.safeParse(body);
    if (!parsedData.success) {
      logger.warn("auth.resend_otp.validation_failed", {
        ip,
        errors: parsedData.error.flatten().fieldErrors,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input data",
          errors: parsedData.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { email } = parsedData.data;
    logger.info("auth.resend_otp.lookup_started", { email });

    // if email we have then using it find an email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      logger.warn("auth.resend_otp.user_not_found", { email });
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    if (user.isVerified) {
      logger.warn("auth.resend_otp.already_verified", { email, userId: user.id });
      return NextResponse.json(
        {
          success: false,
          message: "User Email is already verified",
        },
        { status: 400 },
      );
    }

    // Check cooldown
    const now = new Date();
    if (user.lastOtpRequestedAt) {
      const durationMinutes =
        (now.getTime() - new Date(user.lastOtpRequestedAt).getTime()) /
        (1000 * 60);

      if (durationMinutes < RESEND_COOLDOWN_MINUTES) {
        logger.warn("auth.resend_otp.cooldown_active", {
          email,
          userId: user.id,
          remainingSeconds: Math.ceil((RESEND_COOLDOWN_MINUTES - durationMinutes) * 60),
        });
        return NextResponse.json(
          {
            success: false,
            message: `Please wait ${Math.ceil(RESEND_COOLDOWN_MINUTES - durationMinutes)} more seconds before requesting a new OTP.`,
          },
          { status: 429 }, // 429 Too Many Requests
        );
      }
    }

    // generate new otp code and expiry date
    const verifyCode = randomInt(100000, 1000000).toString();
    const expiryDate = new Date(Date.now() + 30 * 60 * 1000); // 30 min expiry

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastOtpRequestedAt: now,
        verifyCode: verifyCode,
        verifyCodeExpiry: expiryDate,
      },
    });

    logger.info("auth.resend_otp.code_generated", {
      email,
      userId: user.id,
    });

    // send verification email
    const payload: VerifyEmailPayload = {
      email: email,
      username: user.username,
      verifyCode: verifyCode,
      type: "VERIFY",
    };
    const emailResponse = await sendEmail(payload);
    if (!emailResponse.success) {
      logger.error("auth.resend_otp.email_failed", { email, userId: user.id });
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send verification email. Please try again later.",
        },
        { status: 500 },
      );
    }

    // return success response
    return NextResponse.json(
      {
        success: true,
        message:
          "OTP resent successfully. Please check your email for verification code.",
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("auth.resend_otp.error", { error: String(error) });
    return NextResponse.json(
      {
        success: false,
        message: "Resend OTP failed. Please try again later.",
      },
      { status: 500 },
    );
  }
};
