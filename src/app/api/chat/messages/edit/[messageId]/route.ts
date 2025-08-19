import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const editMessageSchema = z.object({
  newMessage: z.string().trim().min(1, "Message cannot be empty"),
});

export async function PATCH(
  req: Request,
  context: { params: { messageId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session?.user?.id) {
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

  const body = await req.json();
  const parsed = editMessageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { newMessage } = parsed.data;

  try {
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageIdNumber },
      select: {
        id: true,
        chatRoomId: true,
        senderId: true,
        isDeleted: true,
        isEdited: true,
        messageType: true,
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
        { success: false, message: "Not authorized to edit this message" },
        { status: 403 }
      );
    }

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
          message: "You are no longer a participant in this chat room",
        },
        { status: 403 }
      );
    }

    if (message.isDeleted) {
      return NextResponse.json(
        {
          success: false,
          message: "Message has been deleted and cannot be edited",
        },
        { status: 400 }
      );
    }

    if (message.isEdited) {
      return NextResponse.json(
        { success: false, message: "Message has already been edited" },
        { status: 400 }
      );
    }

    if (message.messageType !== "TEXT" && message.messageType !== "LINK") {
      return NextResponse.json(
        { success: false, message: "Only text or link messages can be edited" },
        { status: 400 }
      );
    }

    const updated = await prisma.chatMessage.update({
      where: { id: messageIdNumber },
      data: {
        message: newMessage.trim(),
        isEdited: true,
      },
    });

    return NextResponse.json(
      { success: true, message: "Message updated", data: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("[EDIT_MESSAGE_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
