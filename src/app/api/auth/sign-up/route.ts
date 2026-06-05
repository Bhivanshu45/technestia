import { sendEmail } from "@/helpers/sendEmail";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/utils/hashPassword";
import { signUpSchema } from "@/validations/authSchemas/signUpSchema";
import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { VerifyEmailPayload } from "@/types/emailPayload";
import { getIP } from "@/utils/getIP";
import { checkRateLimit } from "@/lib/rateLimit";
import logger from "@/lib/logger";

export const POST = async (req: Request) => {
  try {
    const ip = getIP(req);
    logger.info("signup.request_received", {
      route: "/api/auth/sign-up",
      method: "POST",
      ip,
    });

    // check rate limit based on IP address
    const key = `signup:${ip}`;
    const rateLimitRes = await checkRateLimit(key);
    if (!rateLimitRes.success) {
      logger.warn("signup.rate_limited", {
        route: "/api/auth/sign-up",
        ip,
        key,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Too many requests. Please try again later.",
        },
        { status: 429 },
      );
    }

    const body = await req.json();
    // validate the request data
    const parsedData = signUpSchema.safeParse(body);
    if (!parsedData.success) {
      logger.warn("signup.validation_failed", {
        route: "/api/auth/sign-up",
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

    const { name, username, email, password } = parsedData.data;

    // check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      logger.info("signup.username_exists", {
        route: "/api/auth/sign-up",
        ip,
        username,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Username already exists",
          errors: { username: "Username is already taken" },
        },
        { status: 409 },
      );
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    let verifyCode: string | null = null;

    if (existingEmail) {
      if (existingEmail.isVerified) {
        logger.info("signup.email_conflict_verified", {
          route: "/api/auth/sign-up",
          ip,
          email,
        });
        return NextResponse.json(
          {
            success: false,
            message: "Email already exists, choose another email",
          },
          { status: 409 },
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

        logger.info("signup.unverified_user_updated", {
          route: "/api/auth/sign-up",
          ip,
          userId: existingEmail.id,
          email,
          username,
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

      logger.info("signup.user_created", {
        route: "/api/auth/sign-up",
        ip,
        email,
        username,
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
      logger.error("signup.verification_email_failed", {
        route: "/api/auth/sign-up",
        ip,
        email,
        provider: "resend",
      });
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send verification email. Please try again later.",
        },
        { status: 500 },
      );
    }

    logger.info("signup.verification_email_sent", {
      route: "/api/auth/sign-up",
      ip,
      email,
      provider: "resend",
    });

    // return success response
    logger.info("signup.success", {
      route: "/api/auth/sign-up",
      ip,
      email,
      username,
    });
    return NextResponse.json(
      {
        success: true,
        message:
          "User registered successfully. Please check your email for verification code.",
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("signup.error", {
      route: "/api/auth/sign-up",
      error,
    });

    // console.error("Register API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to register user. Please try again later.",
      },
      { status: 500 },
    );
  }
};
