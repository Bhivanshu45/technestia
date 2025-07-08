import { usernameValidation } from "@/validations/authSchemas/signUpSchema";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const usernameSchema = z.object({
  username: usernameValidation,
});

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    // validate the username
    const parsedData = usernameSchema.safeParse({ username });
    if (!parsedData.success) {
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
    console.error("Error in username uniqueness check:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
};
