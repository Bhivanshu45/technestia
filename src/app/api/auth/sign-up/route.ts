import { sendEmail } from "@/helpers/sendEmail";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/utils/hashPassword";
import { signUpSchema } from "@/validations/authSchemas/signUpSchema";
import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { VerifyEmailPayload } from "@/types/emailPayload";

export const POST = async (req: Request) => {
  try {
    const body = await req.json();

    // validate the request data
    const parsedData = signUpSchema.safeParse(body);
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

    const { name, username, email, password } = parsedData.data;

    // check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return NextResponse.json(
        {
          success: false,
          message: "Username already exists",
          errors: { username: "Username is already taken" },
        },
        { status: 409 }
      );
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    let verifyCode: string | null = null;

    if (existingEmail) {
      if (existingEmail.isVerified) {
        return NextResponse.json(
          {
            success: false,
            message: "Email already exists, choose another email",
          },
          { status: 409 }
        );
      } else {
        // email exist but not verified

        // hash password
        const hashedPassword = await hashPassword(password);
        // generate otp code and expiry date
        verifyCode = randomInt(100000, 1000000).toString();
        const expiryDate = new Date(Date.now() + 30 * 60 * 1000); // 30 min expiry

        // update user with new fields
        await prisma.user.update({
          where: { id: existingEmail.id },
          data: {
            email: email,
            username: username,
            password: hashedPassword,
            isVerified: false,
            verifyCode: verifyCode,
            verifyCodeExpiry: expiryDate,
          },
        });
      }
    } else {
      // email not exist , create new user
      const hashedPassword = await hashPassword(password);
      // generate otp code and expiry date
      verifyCode = randomInt(100000, 1000000).toString();
      const expiryDate = new Date(Date.now() + 30 * 60 * 1000); // 30 min expiry

      await prisma.user.create({
        data: {
          name: name,
          username: username,
          email: email,
          password: hashedPassword,
          isVerified: false,
          verifyCode: verifyCode,
          verifyCodeExpiry: expiryDate,
        },
      });
    }

    // send verification email
    const payload: VerifyEmailPayload = {
      email: email,
      username: username,
      verifyCode: verifyCode,
      type: "VERIFY",
    };
    const emailResponse = await sendEmail(payload);
    if (!emailResponse.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send verification email. Please try again later.",
        },
        { status: 500 }
      );
    }

    // return success response
    return NextResponse.json(
      {
        success: true,
        message:
          "User registered successfully. Please check your email for verification code.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to register user. Please try again later.",
      },
      { status: 500 }
    );
  }
};
