import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import z from "zod";

const updateChatNameSchema = z.object({
  chatName: z.string().min(1).max(100),
});

export async function PUT(
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
  if (!chatroomIdNumber || isNaN(chatroomIdNumber)) {
    return NextResponse.json(
      { success: false, message: "Invalid chatroom ID" },
      { status: 400 }
    );
  }

  const userId = Number(session.user.id);

  const body = await req.json();
  const parsedData = updateChatNameSchema.safeParse(body);
  if (!parsedData.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid input data",
        error: parsedData.error.errors,
      },
      { status: 400 }
    );
  }
  const { chatName } = parsedData.data;

  try {
    const chatroom = await prisma.chatRoom.findUnique({
      where: { id: chatroomIdNumber },
      select: { id: true, name: true, isGroup: true },
    });

    if (!chatroom) {
      return NextResponse.json(
        { success: false, message: "Chatroom not found" },
        { status: 404 }
      );
    }

    if (!chatroom.isGroup) {
      return NextResponse.json(
        { success: false, message: "This is not a group chat" },
        { status: 400 }
      );
    }

    if (chatroom.name === chatName) {
      return NextResponse.json(
        { success: false, message: "New name is the same as current name" },
        { status: 400 }
      );
    }

    const isAdmin = await prisma.chatParticipant.findFirst({
      where: {
        chatRoomId: chatroomIdNumber,
        userId,
        hasLeft: false,
        isAdmin: true,
      },
    });

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "You are not an admin of this chatroom" },
        { status: 403 }
      );
    }

    const updatedChatRoom = await prisma.chatRoom.update({
      where: { id: chatroomIdNumber },
      data: { name: chatName },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Group chat name updated successfully",
        data: updatedChatRoom,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[UPDATE_CHATROOM_NAME_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
