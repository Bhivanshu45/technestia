import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { AccessLevel, CollaborationStatus } from "@prisma/client";

export async function POST(
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

let participantIds: number[] = [];

if (Array.isArray(body.participantIds)) {
  participantIds = (body.participantIds as (string | number)[])
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
}

if (participantIds.length === 0) {
  return NextResponse.json(
    { success: false, message: "No valid participant IDs" },
    { status: 400 }
  );
}



  try {
    const chatroom = await prisma.chatRoom.findUnique({
      where: { id: chatroomIdNumber },
      include: {
        participants: {
          where: { hasLeft: false },
          select: { userId: true, isAdmin: true },
        },
      },
    });

    if (!chatroom || !chatroom.isGroup) {
      return NextResponse.json(
        { success: false, message: "Group not found" },
        { status: 404 }
      );
    }

    // Check if current user is admin
    const currentUser = chatroom.participants.find((p) => p.userId === userId);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Only admins can add participants" },
        { status: 403 }
      );
    }
    const existingIds = new Set(chatroom.participants.map((p) => p.userId));
    let newParticipantsData: { userId: number; isAdmin: boolean }[] = [];

    if (chatroom.projectId) {
      // Project group → Only collaborators can be added
      const collaborators = await prisma.collaboration.findMany({
        where: {
          projectId: chatroom.projectId,
          status: CollaborationStatus.ACCEPTED,
          userId: { in: participantIds },
        },
        select: { userId: true, accessLevel: true },
      });
      if (collaborators.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "No participants are collaborators of this project",
          },
          { status: 400 }
        );
      }

      newParticipantsData = collaborators
        .filter((c) => !existingIds.has(c.userId))
        .map((c) => ({
          userId: c.userId,
          isAdmin: c.accessLevel === AccessLevel.FULL,
        }));
    } else {
      
      newParticipantsData = participantIds
        .filter((id) => !existingIds.has(id))
        .map((id) => ({ userId: id, isAdmin: false }));
    }

    if (newParticipantsData.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid participants to add" },
        { status: 400 }
      );
    }

    await prisma.chatParticipant.createMany({
      data: newParticipantsData.map((p) => ({
        chatRoomId: chatroomIdNumber,
        userId: p.userId,
        isAdmin: p.isAdmin,
       })),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Participants added successfully",
        addedCount: newParticipantsData.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding participants:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
