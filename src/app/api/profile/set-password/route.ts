import { passValidation } from "@/validations/profileSchemas/changePasswordSchema";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/utils/hashPassword";

const setPasswordSchema = z.object({
  newPassword: passValidation,
});

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const parsedData = setPasswordSchema.safeParse(body);

  if (!parsedData.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid password format",
        errors: parsedData.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { newPassword } = parsedData.data;

  try {
    const userId = parseInt(session.user.id);
    const dbUser = await prisma.user.findUnique({ 
        where: { id: userId } 
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (dbUser.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Password is already set. Use Change Password option.",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Password set successfully. You can now log in using your credentials or continue with OAuth",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SET_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}