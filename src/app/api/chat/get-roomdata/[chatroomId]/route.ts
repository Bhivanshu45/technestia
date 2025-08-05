import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: { chatroomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = Number(session.user.id);
    const { chatroomId } = context.params;
    const chatroomIdNumber = Number(chatroomId);

    if (!chatroomIdNumber || isNaN(chatroomIdNumber)) {
      return NextResponse.json(
        { success: false, message: "Invalid chatroom ID" },
        { status: 400 }
      );
    }

    const chatroom = await prisma.chatRoom.findUnique({
      where: { id: chatroomIdNumber },
      include: {
        participants: {
          where: { hasLeft: false },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!chatroom) {
      return NextResponse.json(
        { success: false, message: "Chatroom not found" },
        { status: 404 }
      );
    }

    const currentParticipant = chatroom.participants.find(
      (p): p is (typeof chatroom.participants)[number] & { isAdmin: boolean } =>
        p.user.id === userId
    );

    if (!currentParticipant) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    if (!chatroom.isGroup) {
      const otherUser = chatroom.participants.find(
        (p) => p.user.id !== userId
      )?.user;

      return NextResponse.json({
        success: true,
        data: {
          id: chatroom.id,
          isGroup: false,
          otherUser,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: chatroom.id,
        isGroup: true,
        name: chatroom.name,
        image: chatroom.image,
        totalParticipants: chatroom.participants.length,
        isAdmin: currentParticipant.isAdmin,
        projectId: chatroom.projectId ?? null,
      },
    });
  } catch (error) {
    console.error("Fetch chatroom error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
