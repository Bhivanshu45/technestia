import { resetPasswordSchema } from "@/validations/authSchemas/resetPasswordSchema";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { comparePassword, hashPassword } from "@/utils/hashPassword";

export const POST = async (req: Request) => {
    const body = await req.json();

    // validation
    const parsedData = resetPasswordSchema.safeParse(body);
    if (!parsedData.success) {
        return NextResponse.json({
            success: false,
            message: "Invalid input data",
            errors: parsedData.error.flatten().fieldErrors,
        }, { status: 400 });
    }
    const { email, token, newPassword } = parsedData.data;
    try{
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

      if (!user.resetPasswordToken || !user.resetTokenExpiry) {
        return NextResponse.json(
          {
            success: false,
            message: "Reset password request not found or already used.",
          },
          { status: 400 }
        );
      }

      // Check token expiry
      if (new Date() > user.resetTokenExpiry) {
        return NextResponse.json(
          {
            success: false,
            message: "Reset link has expired. Please request a new one.",
          },
          { status: 409 }
        );
      }

      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      if (hashedToken !== user.resetPasswordToken) {
        return NextResponse.json(
          { success: false, message: "Invalid reset token." },
          { status: 409 }
        );
      }

      // Check if new password is same as old password
      const isSamePassword = await comparePassword(newPassword, user.password);
      if (isSamePassword) {
        return NextResponse.json(
          {
            success: false,
            message: "New password cannot be the same as the old password.",
          },
          { status: 400 }
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

      return NextResponse.json(
        {
          success: true,
          message:
            "Password reset successfully. Redirecting...",
        },
        { status: 200 }
      );
    }catch(error){
        console.error("Error in Reset Password API:", error);
        return NextResponse.json({
            success: false,
            message: "Reset Password failed. Try again later.",
        }, { status: 500 });
    }
} 