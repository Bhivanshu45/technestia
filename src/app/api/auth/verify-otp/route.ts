import { prisma } from "@/lib/prisma";
import { verifyOtpSchema } from "@/validations/authSchemas/verifyOtpSchema";
import { NextResponse } from "next/server";
import { getIP } from "@/utils/getIP";
import { checkRateLimit } from "@/lib/rateLimit";

export const POST = async (req: Request) => {
  try {
    const ip = getIP(req);
    // check rate limit based on IP address
    const key = `verify-otp:${ip}`;
    const rateLimitRes = await checkRateLimit(key);
    if (!rateLimitRes.success) {
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

    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: false, message: "Email is already verified." },
        { status: 400 },
      );
    }

    if (!user.verifyCodeExpiry) {
      return NextResponse.json(
        { success: false, message: "Verification code expiry not found." },
        { status: 400 },
      );
    }

    const codeExpired = Date.now() > user.verifyCodeExpiry?.getTime(); // expire time is lesser than currect time
    if (codeExpired) {
      return NextResponse.json(
        { success: false, message: "Verification code expired." },
        { status: 400 },
      );
    }

    const isCodeValid = user.verifyCode === otp;
    if (!isCodeValid) {
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

    return NextResponse.json(
      { success: true, message: "Email verified successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in User", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify code. Please try again.",
      },
      { status: 500 },
    );
  }
};
