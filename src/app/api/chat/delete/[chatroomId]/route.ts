import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  context: { params: { chatroomId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const { chatroomId } = await context.params;
  const chatroomIdNumber = Number(chatroomId);

  if (!chatroomIdNumber || isNaN(chatroomIdNumber)) {
    return NextResponse.json({ success: false, message: "Invalid chatroom ID" }, { status: 400 });
  }

  try {
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatroomIdNumber },
      include: {
        participants: true,
      },
    });

    if (!chatRoom) {
      return NextResponse.json({ success: false, message: "Chatroom not found" }, { status: 404 });
    }

    const currentParticipant = chatRoom.participants.find((p) => p.userId === userId);
    if (!currentParticipant) {
      return NextResponse.json({ success: false, message: "You are not a participant" }, { status: 403 });
    }

    // 1-on-1 Chat Logic
    if (!chatRoom.isGroup && !chatRoom.projectId) {
      const [otherParticipant] = chatRoom.participants.filter((p) => p.userId !== userId);

      if (currentParticipant.hasLeft) {
        return NextResponse.json({ success: false, message: "You have already left this chat" }, { status: 400 });
      }

      if (otherParticipant.hasLeft) {
        // Both have left → delete entire chatroom and messages
        await prisma.$transaction(async (tx) => {
          await tx.chatMessage.deleteMany({ where: { chatRoomId: chatroomIdNumber } });
          await tx.chatParticipant.deleteMany({ where: { chatRoomId: chatroomIdNumber } });
          await tx.chatRoom.delete({ where: { id: chatroomIdNumber } });
        });

        return NextResponse.json(
          { success: true, message: "Chatroom deleted (both participants have left)" },
          { status: 200 }
        );
      }

      // Only current user leaving
      await prisma.chatParticipant.update({
        where: { id: currentParticipant.id },
        data: { hasLeft: true },
      });

      return NextResponse.json(
        { success: true, message: "You have left the chatroom" },
        { status: 200 }
      );
    }

    // Group Chat Logic (Project or Normal Group)
    if (!currentParticipant.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Only admins can delete the group" },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.chatMessage.deleteMany({ where: { chatRoomId: chatroomIdNumber } });
      await tx.chatParticipant.deleteMany({ where: { chatRoomId: chatroomIdNumber } });
      await tx.chatRoom.delete({ where: { id: chatroomIdNumber } });
    });

    return NextResponse.json(
      { success: true, message: "Chatroom deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DELETE_CHATROOM_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}	

