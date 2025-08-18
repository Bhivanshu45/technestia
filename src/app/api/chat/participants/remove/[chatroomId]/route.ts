import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";

export async function DELETE(
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

  const { chatroomId } = await context.params;
  const chatroomIdNumber = Number(chatroomId);
  const userId = Number(session.user.id);

  if (!chatroomIdNumber || isNaN(chatroomIdNumber)) {
    return NextResponse.json(
      { success: false, message: "Invalid chatroom ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { targetUserId } = body;

  if (!targetUserId || isNaN(Number(targetUserId))) {
    return NextResponse.json(
      { success: false, message: "Invalid target user ID" },
      { status: 400 }
    );
  }

  if (targetUserId === userId) {
    return NextResponse.json(
      { success: false, message: "You cannot remove yourself" },
      { status: 400 }
    );
  }

  try {
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatroomIdNumber },
      include: {
        participants: {
          where: { hasLeft: false },
          select: { userId: true, isAdmin: true },
        },
      },
    });

    if (!chatRoom) {
      return NextResponse.json(
        { success: false, message: "Chatroom not found" },
        { status: 404 }
      );
    }

    if (!chatRoom.isGroup) {
      return NextResponse.json(
        { success: false, message: "Cannot remove user from 1-on-1 chat" },
        { status: 400 }
      );
    }

    const requester = chatRoom.participants.find(
      (p) => p.userId === userId
    );
    const target = chatRoom.participants.find((p) => p.userId === targetUserId);

    if (!requester || !requester.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Only admins can remove participants" },
        { status: 403 }
      );
    }

    if (!target) {
      return NextResponse.json(
        { success: false, message: "Target user is not an active participant" },
        { status: 400 }
      );
    }

    // Soft-remove the user from chat
    await prisma.chatParticipant.updateMany({
      where: {
        chatRoomId: chatroomIdNumber,
        userId: targetUserId,
        hasLeft: false,
      },
      data: {
        hasLeft: true,
        isAdmin: false,
      },
    });

    return NextResponse.json(
      { success: true, message: "Participant removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[REMOVE_PARTICIPANT_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
