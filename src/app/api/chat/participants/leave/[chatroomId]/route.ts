import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  context: { params: { chatroomId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = Number(session.user.id);
  const { chatroomId } = await context.params;
  const chatroomIdNumber = Number(chatroomId);

  if (!chatroomIdNumber || isNaN(chatroomIdNumber)) {
    return NextResponse.json(
      { success: false, message: "Invalid chatroom ID" },
      { status: 400 }
    );
  }

  try {
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatroomIdNumber },
      include: {
        participants: {
          select: {
            userId: true,
            hasLeft: true,
            isAdmin: true,
          },
        },
        _count: { select: { participants: true } },
      },
    });

    if (!chatRoom) {
      return NextResponse.json(
        { success: false, message: "Chatroom not found" },
        { status: 404 }
      );
    }

    const participant = chatRoom.participants.find((p) => p.userId === userId);

    if (!participant) {
      return NextResponse.json(
        { success: false, message: "You are not part of this chatroom" },
        { status: 403 }
      );
    }

    if (participant.hasLeft) {
      return NextResponse.json(
        { success: false, message: "You have already left this chatroom" },
        { status: 400 }
      );
    }

    // ---- 1-on-1 Chatroom Logic ----
    if (!chatRoom.isGroup && chatRoom.participants.length === 2) {
      const other = chatRoom.participants.find((p) => p.userId !== userId);

      if (other?.hasLeft) {
        // Both users have now left — delete chatroom
        await prisma.$transaction([
          prisma.chatMessage.deleteMany({ where: { chatRoomId: chatroomIdNumber } }),
          prisma.chatParticipant.deleteMany({
            where: { chatRoomId: chatroomIdNumber },
          }),
          prisma.chatRoom.delete({ where: { id: chatroomIdNumber } }),
        ]);

        return NextResponse.json(
          { success: true, message: "Chatroom deleted as both users left" },
          { status: 200 }
        );
      }

      // Mark current user as left
      await prisma.chatParticipant.updateMany({
        where: { chatRoomId: chatroomIdNumber, userId },
        data: { hasLeft: true },
      });

      return NextResponse.json(
        { success: true, message: "You have left the chatroom" },
        { status: 200 }
      );
    }

    // ---- Group Chatroom Logic ----
    await prisma.chatParticipant.updateMany({
      where: { chatRoomId: chatroomIdNumber, userId },
      data: { hasLeft: true },
    });

    return NextResponse.json(
      { success: true, message: "You have left the group chatroom" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[LEAVE_CHATROOM_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
