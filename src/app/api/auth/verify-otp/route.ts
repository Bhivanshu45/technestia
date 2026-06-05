import { prisma } from "@/lib/prisma";
import { verifyOtpSchema } from "@/validations/authSchemas/verifyOtpSchema";
import { NextResponse } from "next/server";
import { getIP } from "@/utils/getIP";
import { checkRateLimit } from "@/lib/rateLimit";
import logger from "@/lib/logger";

export const POST = async (req: Request) => {
  try {
    const ip = getIP(req);
    logger.info("auth.verify_otp.request_received", { ip });
    // check rate limit based on IP address
    const key = `verify-otp:${ip}`;
    const rateLimitRes = await checkRateLimit(key);
    if (!rateLimitRes.success) {
      logger.warn("auth.verify_otp.rate_limited", { ip });
      return NextResponse.json(
        {
          success: false,
          message: "Too many requests. Please try again later.",
        },
        { status: 429 },
      );
    }

    const body = await req.json();

    const parsedData = verifyOtpSchema.safeParse(body);
    if (!parsedData.success) {
      logger.warn("auth.verify_otp.validation_failed", {
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

    const { email, otp } = parsedData.data;
    logger.info("auth.verify_otp.lookup_started", { email });

    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      logger.warn("auth.verify_otp.user_not_found", { email });
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    if (user.isVerified) {
      logger.warn("auth.verify_otp.already_verified", { email, userId: user.id });
      return NextResponse.json(
        { success: false, message: "Email is already verified." },
        { status: 400 },
      );
    }

    if (!user.verifyCodeExpiry) {
      logger.warn("auth.verify_otp.expiry_missing", { email, userId: user.id });
      return NextResponse.json(
        { success: false, message: "Verification code expiry not found." },
        { status: 400 },
      );
    }

    const codeExpired = Date.now() > user.verifyCodeExpiry?.getTime(); // expire time is lesser than currect time
    if (codeExpired) {
      logger.warn("auth.verify_otp.code_expired", { email, userId: user.id });
      return NextResponse.json(
        { success: false, message: "Verification code expired." },
        { status: 400 },
      );
    }

    const isCodeValid = user.verifyCode === otp;
    if (!isCodeValid) {
      logger.warn("auth.verify_otp.invalid_code", { email, userId: user.id });
      return NextResponse.json(
        { success: false, message: "Invalid verification code." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verifyCode: null,
        verifyCodeExpiry: null,
      },
    });

    logger.info("auth.verify_otp.success", { email, userId: user.id });

    return NextResponse.json(
      { success: true, message: "Email verified successfully." },
      { status: 200 },
    );
  } catch (error) {
    logger.error("auth.verify_otp.error", { error: String(error) });
    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify code. Please try again.",
      },
      { status: 500 },
    );
  }
};
