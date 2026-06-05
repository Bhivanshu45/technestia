import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function PATCH(
  _req: Request,
  context: { params: { notificationId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    logger.warn("notifications.read_one.unauthorized");
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = Number(session.user.id);
  const { notificationId } = await context.params;
  const notificationIdNumber = Number(decodeURIComponent(notificationId));

  if (!Number.isFinite(notificationIdNumber) || notificationIdNumber <= 0) {
    logger.warn("notifications.read_one.invalid_notification_id", { notificationId });
    return NextResponse.json(
      { success: false, message: "Invalid notification ID" },
      { status: 400 },
    );
  }

  try {
    logger.info("notifications.read_one.request_received", { userId, notificationId: notificationIdNumber });
    const existing = await prisma.notification.findFirst({
      where: { id: notificationIdNumber, userId },
    });

    if (!existing) {
      logger.warn("notifications.read_one.notification_not_found", { userId, notificationId: notificationIdNumber });
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 },
      );
    }

    if (!existing.isRead) {
      await prisma.notification.update({
        where: { id: existing.id },
        data: { isRead: true },
      });
    }

    logger.info("notifications.read_one.success", { userId, notificationId: notificationIdNumber });

    const io = (globalThis as any).__io;
    if (io) {
      io.to("user:" + userId).emit("notification:read-sync", {
        notificationId: existing.id,
        isRead: true,
      });
    }

    return NextResponse.json(
      { success: true, message: "Notification marked as read" },
      { status: 200 },
    );
  } catch (error) {
    logger.error("notifications.read_one.error", { error: String(error), userId, notificationId: notificationIdNumber });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
