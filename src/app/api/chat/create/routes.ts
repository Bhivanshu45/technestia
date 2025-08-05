import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/options";
import { createChatSchema } from "@/validations/chatSchema/createChatSchema";
import { CollaborationStatus } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id || !session?.user?.id) {
    return NextResponse.json({ 
        success: false,
        message: "Unauthorised User",
         error: "Unauthorized" 
    }, { status: 401 });
  }

  const currentUserId = Number(session.user.id);
  const body = await req.json();
  const parsedData = createChatSchema.safeParse(body);
  if (!parsedData.success) {
    return NextResponse.json(
      { success: false,
        message: "Invalid input data",
        error: parsedData.error.errors },
      { status: 400 }
    );
  }
  const {
    isGroup,
    name,
    image,
    projectId,
    participantIds,
    targetUserId,
  } = parsedData.data;

  let chatName = name;
  try {
    
    if (isGroup && !chatName && projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { title: true },
      });

      if (!project) {
        return NextResponse.json(
          { success: false, message: "Project not found" },
          { status: 404 }
        );
      }

      chatName = project.title;
    }

    if (isGroup && !chatName) {
      return NextResponse.json(
        { success: false, message: "Group chat name is required" },
        { status: 400 }
      );
    }

    if (!isGroup && !targetUserId) {
      return NextResponse.json(
        { success: false, message: "Target user ID is required for 1-on-1 chat" },
        { status: 400 }
      );
    }
    if (!isGroup && targetUserId === currentUserId) {
      return NextResponse.json(
        { success: false, message: "You cannot create chat with yourself" },
        { status: 400 }
      );
    }

    if (!isGroup) {
      const existingChat = await prisma.chatRoom.findFirst({
        where: {
          isGroup: false,
          name: null,
          projectId: null, 
          participants: {
            every: {
              userId: { in: [currentUserId, targetUserId!] },
            },
            some: {
              userId: currentUserId,
            },
          },
        },
        include: {
          participants: {
            include: { user: true },
          },
        },
      });

      if (existingChat) {
        return NextResponse.json(
          {
            success: true,
            message: "Chat already exists",
            data: existingChat,
          },
          { status: 200 }
        );
      }

      // Create new 1-on-1 chat
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId! },
        select: { name: true,image: true },
      });

      const newChat = await prisma.chatRoom.create({
        data: {
          isGroup: false,
          name: targetUser?.name,
          image: targetUser?.image || null,
          lastMessageAt: new Date(),
          participants: {
            create: [{ userId: currentUserId }, { userId: targetUserId! }],
          },
        },
        include: {
          participants: {
            include: { user: true },
          },
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "1-on-1 Chat created successfully",
          data: newChat,
        },
        { status: 201 }
      );
    }

    const uniqueParticipantIds = Array.from(
      new Set(participantIds!.concat(currentUserId))
    );

    if (isGroup && projectId) {
      const existingGroup = await prisma.chatRoom.findFirst({
        where: {
          isGroup: true,
          projectId,
        },
      });

      if (existingGroup) {
        return NextResponse.json(
          {
            success: true,
            message: "Group chat for this project already exists",
            data: existingGroup,
          },
          { status: 200 }
        );
      }

      const collaborators = await prisma.collaboration.findMany({
        where: {
          projectId,
          status: CollaborationStatus.ACCEPTED,
        },
        select: { userId: true },
      });

      const projectOwner = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true },
      });

      const validUserIds = new Set([
        ...collaborators.map((c) => c.userId),
        projectOwner?.userId,
      ]);

      const invalidUsers = uniqueParticipantIds.filter(
        (id) => !validUserIds.has(id)
      );
      if (invalidUsers.length) {
        return NextResponse.json(
          {
            success: false,
            message: "Some participants are not part of the project",
            invalidUsers,
          },
          { status: 403 }
        );
      }
    }


    const newGroupChat = await prisma.chatRoom.create({
      data: {
        isGroup: true,
        name: chatName!,
        image,
        projectId,
        lastMessageAt: new Date(),
        participants: {
          create: uniqueParticipantIds.map((id) => ({
            userId: id,
            isAdmin: id === currentUserId,
          })),
        },
      },
      include: {
        participants: {
          include: { user: true },
        },
      },
    });


    return NextResponse.json(
      {
        success: true,
        message: "Group chat created successfully",
        data: newGroupChat,
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("[CHAT_CREATE_ERROR]", error);
    return NextResponse.json(
      { 
        success: false,
        message:"Internal server error",
     },{ status: 500 }
    );
  }
}
