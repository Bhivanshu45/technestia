import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/helpers/sendEmail";
import { ResetPasswordPayload } from "@/types/emailPayload";
import { forgotPasswordSchema } from "@/validations/authSchemas/forgotPasswordSchema";
import { getIP } from "@/utils/getIP";
import { checkRateLimit } from "@/lib/rateLimit";
import logger from "@/lib/logger";

export const POST = async (req: Request) => {
  const ip = getIP(req);
  logger.info("auth.forgot_password.request_received", { ip });
  // check rate limit based on IP address
  const key = `forgot-password:${ip}`;
  const rateLimitRes = await checkRateLimit(key);
  if (!rateLimitRes.success) {
    logger.warn("auth.forgot_password.rate_limited", { ip });
    return NextResponse.json(
      {
        success: false,
        message: "Too many requests. Please try again later.",
      },
      { status: 429 },
    );
  }

  
  const body = await req.json();

  const parsedData = forgotPasswordSchema.safeParse(body);
  if (!parsedData.success) {
    logger.warn("auth.forgot_password.validation_failed", {
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

  try {
    logger.info("auth.forgot_password.lookup_started", { email });
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      logger.warn("auth.forgot_password.user_not_found", { email });
      return NextResponse.json(
        {
          success: false,
          message: "User not found with this email",
        },
        { status: 404 },
      );
    }
    if (!user.isVerified) {
        logger.warn("auth.forgot_password.user_not_verified", { email, userId: user.id });
      return NextResponse.json(
        {
          success: false,
          message: "Your account is not verified",
        },
        { status: 403 },
      );
    }

    // generate a token with expiry of 15 minutes for reset password
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedResetToken,
        resetTokenExpiry: resetTokenExpiry,
      },
    });

    logger.info("auth.forgot_password.reset_token_created", { email, userId: user.id });

    // generate link with the token and email in the link
    const resetPasswordLink = `${process.env.RESET_PASSWORD_PAGE_URL}?token=${resetToken}&email=${email}`;

    // send reset password email
    const payload: ResetPasswordPayload = {
      email: user.email,
      username: user.username,
      type: "RESET_PASSWORD",
      resetLink: resetPasswordLink,
    };
    const emailResponse = await sendEmail(payload);
    if (!emailResponse.success) {
      logger.error("auth.forgot_password.email_failed", { email, userId: user.id });
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send reset password email. Try again later.",
        },
        { status: 500 },
      );
    }

    // return success response
    return NextResponse.json(
      {
        success: true,
        message: "Reset password link sent to your email.",
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("auth.forgot_password.error", { error: String(error) });
    return NextResponse.json(
      {
        success: false,
        message: "Reset Password link sending failed. Try again later.",
      },
      { status: 500 },
    );
  }
};
