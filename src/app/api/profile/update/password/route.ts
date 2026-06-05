import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { changePasswordSchema } from "@/validations/profileSchemas/changePasswordSchema";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, hashPassword } from "@/utils/hashPassword";
import logger from "@/lib/logger";

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if(!session || !session.user || !session.user.id){
        logger.warn("profile.update_password.unauthorized");
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
    }

    const body = await req.json();
    const parsedData = changePasswordSchema.safeParse(body)
    if(!parsedData.success){
        logger.warn("profile.update_password.validation_failed", {
          errors: parsedData.error.flatten().fieldErrors,
        });
        return NextResponse.json(
          {
            success: false,
            message: "Invalid password format",
            errors: parsedData.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
    }

    const { currentPassword,newPassword} = parsedData.data;
    if (currentPassword === newPassword) {
      logger.warn("profile.update_password.same_password", { userId: session.user.id });
      return NextResponse.json(
        {
          success: false,
          message: "New password cannot be the same as the current password",
        },
        { status: 400 }
      );
    }
    try{
        const userId = parseInt(session.user.id);
        logger.info("profile.update_password.request_received", { userId });
        const dbUser = await prisma.user.findUnique({
            where : {id: userId}
        })

        if (!dbUser) {
          logger.warn("profile.update_password.user_not_found", { userId });
          return NextResponse.json(
            { success: false, message: "User not found" },
            { status: 404 }
          );
        }

        if (!dbUser.password) {
          logger.warn("profile.update_password.oauth_user", { userId });
          return NextResponse.json(
            {
              success: false,
              message:
                "This account was created via OAuth. Try setting a password.",
            },
            { status: 400 }
          );
        }

        const isPasswordMatch = await comparePassword(currentPassword,dbUser.password);
        if(!isPasswordMatch){
            logger.warn("profile.update_password.current_password_invalid", { userId });
            return NextResponse.json(
              { success: false, message: "Current password is incorrect" },
              { status: 400 }
            );
        }

        const hashedNewPassword = await hashPassword(newPassword);
        await prisma.user.update({
          where: { id: userId },
          data: { password: hashedNewPassword },
        });

        logger.info("profile.update_password.success", { userId });

        return NextResponse.json(
          { success: true, message: "Password changed successfully" },
          { status: 200 }
        );
    }catch(error){
        logger.error("profile.update_password.error", { error: String(error) });
        return NextResponse.json(
          { success: false, message: "Internal Server Error" },
          { status: 500 }
        );
    }
}