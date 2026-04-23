import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json(
      { success: false, message: "Invalid user ID" },
      { status: 400 },
    );
  }

  try {
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

    return NextResponse.json(
      { success: true, message: "All notifications marked as read" },
      { status: 200 },
    );
  } catch (error) {
    console.error("[READ_ALL_NOTIFICATIONS_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
