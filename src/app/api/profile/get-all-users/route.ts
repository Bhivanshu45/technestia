import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function GET(_req: Request) {
  try {
    logger.info("profile.get_all_users.request_received");
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
      },
      orderBy: {
        achievementPoints: "desc",
      },
    });

    return NextResponse.json({ 
        success: true,
        message: "All public profiles fetched successfully",
        users 
    }, { status: 200 });
  } catch (error) {
    logger.error("profile.get_all_users.error", { error: String(error) });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
