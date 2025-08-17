import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/options";
import { createChatSchema } from "@/validations/chatSchema/createChatSchema";
import { AccessLevel, CollaborationStatus } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized user",
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const currentUserId = Number(session.user.id);
  const body = await req.json();
  const parsedData = createChatSchema.safeParse(body);

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

  const { isGroup, name, image, projectId, participantIds, targetUserId } =
    parsedData.data;
  let chatName = name;

  try {
    if (isGroup && !chatName && projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { title: true },
      });

      if (!project)
        return NextResponse.json(
          { success: false, message: "Project not found" },
          { status: 404 }
        );
      chatName = project.title;
    }

    if (isGroup && !chatName) {
      return NextResponse.json(
        { success: false, message: "Group chat name is required" },
        { status: 400 }
      );
    }

    if (!isGroup) {
      if (!targetUserId)
        return NextResponse.json(
          { success: false, message: "Target user ID is required" },
          { status: 400 }
        );
      if (targetUserId === currentUserId)
        return NextResponse.json(
          { success: false, message: "Cannot create chat with yourself" },
          { status: 400 }
        );

      const existingChat = await prisma.chatRoom.findFirst({
        where: {
          isGroup: false,
          name: null,
          projectId: null,
          participants: {
            every: { userId: { in: [currentUserId, targetUserId] } },
            some: { userId: currentUserId },
          },
        },
        include: { participants: { include: { user: true } } },
      });

      if (existingChat)
        return NextResponse.json(
          {
            success: true,
            message: "Chat already exists",
            data: {
              id: existingChat.id,
              isGroup: false,
              otherUser: await prisma.user.findUnique({
                where: { id: targetUserId },
                select: { id: true, name: true, image: true },
              }),
            },
          },
          { status: 200 }
        );

      // Create new 1-on-1 chat
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { name: true, image: true },
      });

      const newChat = await prisma.chatRoom.create({
        data: {
          isGroup: false,
          name: targetUser?.name,
          image: targetUser?.image || null,
          lastMessageAt: new Date(),
          participants: {
            create: [{ userId: currentUserId }, { userId: targetUserId }],
          },
        },
        include: { participants: { include: { user: true } } },
      });

      return NextResponse.json(
        {
          success: true,
          message: "1-on-1 Chat created successfully",
          data: { id: newChat.id, isGroup: false, otherUser: targetUser },
        },
        { status: 201 }
      );

    }

    let adminIds: number[] = [];
    let allParticipantIds = new Set<number>();

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true },
      });
      if (!project)
        return NextResponse.json(
          { success: false, message: "Project not found" },
          { status: 404 }
        );

      const existingGroup = await prisma.chatRoom.findFirst({
        where: { projectId },
        include: {
          participants: {
            where: { hasLeft: false }
          },
        }
      });
      if (existingGroup)
        return NextResponse.json(
          {
            success: true,
            message: "Group chat for this project already exists",
            data: {
              id: existingGroup.id,
              isGroup: true,
              name: existingGroup.name,
              image: existingGroup.image,
              totalParticipants: existingGroup.participants.length,
              isAdmin: adminIds.includes(currentUserId),
              projectId: existingGroup.projectId,
            },
          },
          { status: 200 }
        );

      const fullAccessCollaborators = await prisma.collaboration.findMany({
        where: {
          projectId,
          status: CollaborationStatus.ACCEPTED,
          accessLevel: AccessLevel.FULL,
        },
        select: { userId: true },
      });

      adminIds = [
        project.userId,
        ...fullAccessCollaborators.map((c) => c.userId),
      ];

      // Only owner or FULL access can create group
      if (!adminIds.includes(currentUserId)) {
        return NextResponse.json(
          {
            success: false,
            message: "You don't have permission to create this group",
          },
          { status: 403 }
        );
      }

      allParticipantIds = new Set([...adminIds, ...(participantIds || [])]);

      const validCollaborators = await prisma.collaboration.findMany({
        where: { projectId, status: CollaborationStatus.ACCEPTED },
        select: { userId: true },
      });
      const validUserIds = new Set([
        ...validCollaborators.map((c) => c.userId),
        project.userId,
      ]);
      const invalidUsers = Array.from(allParticipantIds).filter(
        (id) => !validUserIds.has(id)
      );
      if (invalidUsers.length)
        return NextResponse.json(
          {
            success: false,
            message: "Some participants are not part of the project",
            invalidUsers,
          },
          { status: 403 }
        );
    } else {
      // Non-project group chat
      allParticipantIds = new Set([currentUserId, ...(participantIds || [])]);
      adminIds = [currentUserId];
    }

    // Create group chat
    const newGroupChat = await prisma.chatRoom.create({
      data: {
        isGroup: true,
        name: chatName!,
        image,
        projectId,
        lastMessageAt: new Date(),
        participants: {
          create: Array.from(allParticipantIds).map((userId) => ({
            userId,
            isAdmin: adminIds.includes(userId),
          })),
        },
      },
      include: { participants: { include: { user: true } } },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Group chat created successfully",
        data: {
          id: newGroupChat.id,
          isGroup: true,
          name: newGroupChat.name,
          image: newGroupChat.image,
          totalParticipants: allParticipantIds.size,
          isAdmin: adminIds.includes(currentUserId),
          projectId: newGroupChat.projectId ?? null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CHAT_CREATE_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
