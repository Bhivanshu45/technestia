import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: Request,
  context: { params: { notificationId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = Number(session.user.id);
  const { notificationId } = await context.params;
  const notificationIdNumber = Number(decodeURIComponent(notificationId));

  if (!Number.isFinite(notificationIdNumber) || notificationIdNumber <= 0) {
    return NextResponse.json(
      { success: false, message: "Invalid notification ID" },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.notification.findFirst({
      where: { id: notificationIdNumber, userId },
    });

    if (!existing) {
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
    console.error("[READ_NOTIFICATION_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
