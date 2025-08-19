import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  context: { params: { messageId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = Number(session.user.id);
  const { messageId } = await context.params;
  const messageIdNumber = Number(messageId);

  if (!messageIdNumber || isNaN(messageIdNumber)) {
    return NextResponse.json(
      { success: false, message: "Invalid message ID" },
      { status: 400 }
    );
  }

  try {
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageIdNumber },
      select: {
        id: true,
        chatRoomId: true,
        senderId: true,
        isDeleted: true,
      },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, message: "Message not found" },
        { status: 404 }
      );
    }

    if (message.senderId !== userId) {
      return NextResponse.json(
        { success: false, message: "You are not the sender of this message" },
        { status: 403 }
      );
    }

    // Check if user is still a participant (hasn't left)
    const isParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatRoomId: message.chatRoomId,
        userId: userId,
        hasLeft: false,
      },
    });

    if (!isParticipant) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not a participant in this chat room",
        },
        { status: 403 }
      );
    }

    if (message.isDeleted) {
      return NextResponse.json(
        { success: false, message: "Message already deleted" },
        { status: 400 }
      );
    }

    await prisma.chatMessage.update({
      where: { id: messageIdNumber },
      data: {
        isDeleted: true,
        message: "This message has been deleted",
      },
    });

    return NextResponse.json(
      { success: true, message: "Message deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DELETE_MESSAGE_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
