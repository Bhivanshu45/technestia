import { resetPasswordSchema } from "@/validations/authSchemas/resetPasswordSchema";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { comparePassword, hashPassword } from "@/utils/hashPassword";
import { getIP } from "@/utils/getIP";
import { checkRateLimit } from "@/lib/rateLimit";
import logger from "@/lib/logger";

export const POST = async (req: Request) => {
  const ip = getIP(req);
  logger.info("auth.reset_password.request_received", { ip });
  // check rate limit based on IP address
  const key = `reset-password:${ip}`;
  const rateLimitRes = await checkRateLimit(key);
  if (!rateLimitRes.success) {
    logger.warn("auth.reset_password.rate_limited", { ip });
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
  const parsedData = resetPasswordSchema.safeParse(body);
  if (!parsedData.success) {
    logger.warn("auth.reset_password.validation_failed", {
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
  const { email, token, newPassword } = parsedData.data;
  try {
    logger.info("auth.reset_password.lookup_started", { email });
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logger.warn("auth.reset_password.user_not_found", { email });
      return NextResponse.json(
        {
          success: false,
          message: "User not found with this email",
        },
        { status: 404 },
      );
    }

    if (!user.resetPasswordToken || !user.resetTokenExpiry) {
      logger.warn("auth.reset_password.request_missing", { email, userId: user.id });
      return NextResponse.json(
        {
          success: false,
          message: "Reset password request not found or already used.",
        },
        { status: 400 },
      );
    }

    // Check token expiry
    if (new Date() > user.resetTokenExpiry) {
      logger.warn("auth.reset_password.token_expired", { email, userId: user.id });
      return NextResponse.json(
        {
          success: false,
          message: "Reset link has expired. Please request a new one.",
        },
        { status: 409 },
      );
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    if (hashedToken !== user.resetPasswordToken) {
      logger.warn("auth.reset_password.invalid_token", { email, userId: user.id });
      return NextResponse.json(
        { success: false, message: "Invalid reset token." },
        { status: 409 },
      );
    }

    // Check if new password is same as old password
    const isSamePassword = await comparePassword(newPassword, user.password);
    if (isSamePassword) {
      logger.warn("auth.reset_password.same_password", { email, userId: user.id });
      return NextResponse.json(
        {
          success: false,
          message: "New password cannot be the same as the old password.",
        },
        { status: 400 },
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // update the user password and clear the reset token and expiry
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetTokenExpiry: null,
      },
    });

    logger.info("auth.reset_password.success", { email, userId: user.id });

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successfully. Redirecting...",
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("auth.reset_password.error", { error: String(error) });
    return NextResponse.json(
      {
        success: false,
        message: "Reset Password failed. Try again later.",
      },
      { status: 500 },
    );
  }
};
