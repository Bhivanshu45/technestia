import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function GET(_req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    logger.warn("profile.mydata.unauthorized");
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const userId = parseInt(session.user.id);
    logger.info("profile.mydata.request_received", { userId });

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        role: true,
        githubUrl: true,
        linkedinUrl: true,
        websiteUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!dbUser) {
      logger.warn("profile.mydata.user_not_found", { userId });
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
        success: true,
        message: "User profile fetched successfully",
        user: dbUser
     }, { status: 200 });
  } catch (error) {
    logger.error("profile.mydata.error", { error: String(error) });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
