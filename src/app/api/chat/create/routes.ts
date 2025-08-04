import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/options";
import { createChatSchema } from "@/validations/chatSchema/createChatSchema";

export async function POST(req: NextRequest) {
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
        { success: false, message: "Cannot create chat with yourself" },
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
      const newChat = await prisma.chatRoom.create({
        data: {
          isGroup: false,
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

    const newGroupChat = await prisma.chatRoom.create({
      data: {
        isGroup: true,
        name: chatName!,
        image,
        projectId,
        lastMessageAt: new Date(),
        participants: {
          create: uniqueParticipantIds.map((id) => ({ userId: id })),
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
