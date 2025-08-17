import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: { chatroomId: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
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
  try {
    
    const participants = await prisma.chatParticipant.findMany({
      where: { chatRoomId: chatroomIdNumber, hasLeft: false },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            email: true,
          },
        },
      },
    });

    const isParticipant = participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      return NextResponse.json(
        { success: false, message: "You are not part of this group" },
        { status: 403 }
      );
    }


    const sortedParticipants = participants.sort((a, b) => {
      if (a.isAdmin && !b.isAdmin) return -1;
      if (!a.isAdmin && b.isAdmin) return 1;
      return a.user.name.localeCompare(b.user.name, undefined, {
        sensitivity: "base",
      });
    });

    return NextResponse.json({
      success: true,
      message: "Participants fetched successfully",
      participants: sortedParticipants,
    });
  } catch (error) {
    console.error("Error fetching group participants:", error);
    return NextResponse.json(
      { success: false,message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
