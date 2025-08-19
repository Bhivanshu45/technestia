import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";

// GET /api/chat/messages/[chatroomId]?cursor=<lastMessageId>&limit=20

export async function GET(
  req: Request,
  context: { params: { chatroomId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = Number(session.user.id);
  const { chatroomId } = await context.params;
  const chatroomIdNumber = Number(chatroomId);
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor"); // createdAt timestamp
  const limitParam = searchParams.get("limit");
  const limit = Math.min(Number(limitParam) || 20, 50); // default 20, max 50

  if (!chatroomIdNumber || isNaN(chatroomIdNumber)) {
    return NextResponse.json(
      { success: false, message: "Invalid chatroom ID" },
      { status: 400 }
    );
  }
  
  try {
    // verify chatroom exists
    const chatRoom = await prisma.chatRoom.findUnique({
        where: { id: chatroomIdNumber },
    });

    if (!chatRoom) {
      return NextResponse.json(
        { success: false, message: "Chat room not found" },
        { status: 404 }
      );
    }

    // Verify user is a participant
    const participant = await prisma.chatParticipant.findFirst({
      where: { chatRoomId: chatroomIdNumber, userId, hasLeft: false },
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

    const messages = await prisma.chatMessage.findMany({
      where: { chatRoomId: chatroomIdNumber },
      take: limit + 1,
      orderBy: { createdAt: "desc" },
      ...(cursor && {
        cursor: { id: Number(cursor) },
        skip: 1,
      }),
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });


    const hasNextPage = messages.length > limit;
    const trimmedMessages = hasNextPage ? messages.slice(0, limit) : messages;

    const nextCursor = hasNextPage
      ? trimmedMessages[trimmedMessages.length - 1].createdAt.toISOString()
      : null;

    return NextResponse.json(
      {
        success: true,
        messages: trimmedMessages,
        nextCursor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[FETCH_MESSAGES_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
