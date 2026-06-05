import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    logger.warn("notifications.read_all.unauthorized");
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    logger.warn("notifications.read_all.invalid_user_id", { userId: session.user.id });
    return NextResponse.json(
      { success: false, message: "Invalid user ID" },
      { status: 400 },
    );
  }

  try {
    logger.info("notifications.read_all.request_received", { userId });
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    const io = (globalThis as any).__io;
    if (io) {
      io.to("user:" + userId).emit("notification:read-sync", {
        all: true,
        isRead: true,
      });
      io.to("user:" + userId).emit("notification:read-all-sync", {
        userId,
      });
    }

    logger.info("notifications.read_all.success", { userId });

    return NextResponse.json(
      { success: true, message: "All notifications marked as read" },
      { status: 200 },
    );
  } catch (error) {
    logger.error("notifications.read_all.error", { error: String(error), userId });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
