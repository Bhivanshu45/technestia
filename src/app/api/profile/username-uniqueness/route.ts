import { usernameValidation } from "@/validations/authSchemas/signUpSchema";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import logger from "@/lib/logger";

const usernameSchema = z.object({
  username: usernameValidation,
});

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    logger.info("profile.username_uniqueness.request_received", { username });

    // validate the username
    const parsedData = usernameSchema.safeParse({ username });
    if (!parsedData.success) {
      logger.warn("profile.username_uniqueness.validation_failed", { username, errors: parsedData.error.flatten().fieldErrors });
      return NextResponse.json(
        {
          success: false,
          message: "Invalid username format",
          errors: parsedData.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const validatedUsername = parsedData.data.username;

    // check if username already exists
    const existingUsername = await prisma.user.findFirst({
      where: { username: validatedUsername },
    });

    if (existingUsername) {
      logger.info("profile.username_uniqueness.username_exists", { username: validatedUsername });
      return NextResponse.json(
        {
          success: false,
          message: "Username already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Username is available.",
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("profile.username_uniqueness.error", { error: String(error) });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
};
