import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary"; 
import { sendMessageSchema } from "@/validations/chatSchema/sendMessageSchema"; 

export async function POST(
  req: Request,
  context: { params: { chatroomId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
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
      { success: false, message: "Invalid chat room ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsedData = sendMessageSchema.safeParse(body);

  if (!parsedData.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid input",
        errors: parsedData.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { messageType, content,file } = parsedData.data;

  try {
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatroomIdNumber },
    });
    if (!chatRoom) {
      return NextResponse.json(
        { success: false, message: "Chat room not found" },
        { status: 404 }
      );
    }
    
    const participant = await prisma.chatParticipant.findFirst({
      where: { chatRoomId: chatroomIdNumber, userId, hasLeft: false },
    });

    if (!participant) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not an active participant in this chat room",
        },
        { status: 403 }
      );
    }

    let messageContent = "";
    let publicId: string | null = null;
    if (messageType === "TEXT" || messageType === "LINK") {
      if (!content || !content.trim()) {
        return NextResponse.json(
          { success: false, message: "Message content is required" },
          { status: 400 }
        );
      }
      messageContent = content.trim();
    } else if ((messageType === "IMAGE" || messageType === "FILE") && file) {
      const buffer = Buffer.from(file.buffer, "base64");
      const type = file.type.startsWith("video") ? "video" : file.type.startsWith("image") ? "image" : "raw";

      const uploaded = await uploadToCloudinary(buffer, type);
      messageContent = uploaded.secureUrl;
      publicId = uploaded.publicId;
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid file input for media message" },
        { status: 400 }
      );
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        chatRoomId: chatroomIdNumber,
        senderId: userId,
        message: messageContent,
        messageType,
        cloudinaryPublicId: publicId,
      },
    });

    await prisma.chatRoom.update({
      where: { id: chatroomIdNumber },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json(
      { success: true, message: "Message sent", data: newMessage },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SEND_MESSAGE_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
