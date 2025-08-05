import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { getUnreadMessageCount } from "@/utils/getUnreadMessagesCount";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const currentUserId = Number(session.user.id);

    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        participants: {
          some: {
            userId: currentUserId,
            hasLeft: false,
          },
        },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        participants: {
          where: {
            hasLeft: false,
          },
          select: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    const formatted = await Promise.all(
      chatRooms.map(async (chat) => {
        const latestMsg = chat.messages[0];

        const unreadCount = await getUnreadMessageCount({
          chatRoomId: chat.id,
          userId: currentUserId,
        });

        let name = chat.name;
        let image = chat.image;

        if (!chat.isGroup && !chat.project) {
          const otherUser = chat.participants.find(
            (p) => p.user.id !== currentUserId
          )?.user;
          name = otherUser?.name ?? chat.name ?? "Unknown";
          image = otherUser?.image ?? chat.image ?? null;
        } else if (chat.project) {
          name = chat.project.title;
        }

        return {
          id: chat.id,
          name,
          image,
          isGroup: chat.isGroup,
          latestMessage: latestMsg?.message || null,
          latestMessageSender: latestMsg?.sender?.name || null,
          latestMessageAt: latestMsg?.createdAt || null,
          unreadCount,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        message: "Chat rooms fetched successfully",
        chatRooms: formatted,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET_CHATROOMS_ERROR]", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
