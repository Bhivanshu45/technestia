import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/helpers/sendEmail";
import { ResetPasswordPayload } from "@/types/emailPayload";
import { forgotPasswordSchema } from "@/validations/authSchemas/forgotPasswordSchema";

export const POST = async (req: Request) => {
  const body = await req.json();

  const parsedData = forgotPasswordSchema.safeParse(body);
  if (!parsedData.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid input data",
        errors: parsedData.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { email } = parsedData.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found with this email",
        },
        { status: 404 }
      );
    }
    if (!user.isVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is not verified",
        },
        { status: 403 }
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
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send reset password email. Try again later.",
        },
        { status: 500 }
      );
    }

    // return success response
    return NextResponse.json(
      {
        success: true,
        message: "Reset password link sent to your email.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in sending reset password email:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Reset Password link sending failed. Try again later.",
      },
      { status: 500 }
    );
  }
};
