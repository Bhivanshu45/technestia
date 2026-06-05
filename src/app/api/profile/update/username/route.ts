import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { usernameValidation } from "@/validations/authSchemas/signUpSchema";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import logger from "@/lib/logger";

const updateUsernameSchema = z.object({
  username: usernameValidation,
});

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    logger.warn("profile.update_username.unauthorized");
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const parsedData = updateUsernameSchema.safeParse(body);

  if (!parsedData.success) {
    logger.warn("profile.update_username.validation_failed", {
      errors: parsedData.error.flatten().fieldErrors,
    });
    return NextResponse.json(
      {
        success: false,
        message: "Invalid username format",
        errors: parsedData.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { username } = parsedData.data;

  try {
    const userId = parseInt(session.user.id);
    logger.info("profile.update_username.request_received", { userId, username });

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser && existingUser.id !== userId) {
      logger.warn("profile.update_username.username_taken", { userId, username });
      return NextResponse.json(
        { success: false, message: "Username already taken" },
        { status: 409 }
      );
    }

    if (existingUser && existingUser.id === userId) {
      logger.warn("profile.update_username.same_username", { userId, username });
      return NextResponse.json(
        { success: false, message: "You already have this username" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { username },
    });

    logger.info("profile.update_username.success", { userId, username });

    return NextResponse.json(
      { success: true, message: "Username updated successfully" },
      { status: 200 }
    );

  } catch (error) {
    logger.error("profile.update_username.error", { error: String(error) });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
