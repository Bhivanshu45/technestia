import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    logger.warn("notifications.my.unauthorized");
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    logger.warn("notifications.my.invalid_user_id", { userId: session.user.id });
    return NextResponse.json(
      { success: false, message: "Invalid user ID" },
      { status: 400 },
    );
  }

  try {
    logger.info("notifications.my.request_received", { userId });
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json(
      {
        success: true,
        message: "Notifications fetched successfully",
        notifications,
        unreadCount,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("notifications.my.error", { error: String(error), userId });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
