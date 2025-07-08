import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { changePasswordSchema } from "@/validations/profileSchemas/changePasswordSchema";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, hashPassword } from "@/utils/hashPassword";

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if(!session || !session.user || !session.user.id){
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
    }

    const body = await req.json();
    const parsedData = changePasswordSchema.safeParse(body)
    if(!parsedData.success){
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
        const dbUser = await prisma.user.findUnique({
            where : {id: userId}
        })

        if (!dbUser) {
          return NextResponse.json(
            { success: false, message: "User not found" },
            { status: 404 }
          );
        }

        if (!dbUser.password) {
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

        return NextResponse.json(
          { success: true, message: "Password changed successfully" },
          { status: 200 }
        );
    }catch(error){
        console.error("[CHANGE_PASSWORD_ERROR]", error);
        return NextResponse.json(
          { success: false, message: "Internal Server Error" },
          { status: 500 }
        );
    }
}