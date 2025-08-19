import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: Request,
  context: { params: { chatroomId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const {chatroomId }= await context.params;
  const chatroomIdNumber = Number(chatroomId);

  if (!chatroomIdNumber || isNaN(chatroomIdNumber)) {
    return NextResponse.json({ error: "Invalid chatRoomId" }, { status: 400 });
  }

  try {
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatRoomId: chatroomIdNumber,
        userId,
        hasLeft: false,
      },
    });

    if (!participant) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not a participant in this chatroom",
        },
        { status: 403 }
      );
    }

    await prisma.chatParticipant.update({
      where: {
        chatRoomId_userId: {
          chatRoomId: chatroomIdNumber,
          userId: userId,
        },
      },
      data: {
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({ success: true ,message: "Marked as read"}, { status: 200 });
  } catch (error) {
    console.error("[MARK_READ_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
