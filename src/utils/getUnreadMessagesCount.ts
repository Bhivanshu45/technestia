import { prisma } from "@/lib/prisma";

export async function getUnreadMessageCount({
  chatRoomId,
  userId,
}: {
  chatRoomId: number;
  userId: number;
}): Promise<number> {
  const participant = await prisma.chatParticipant.findFirst({
    where: {
      chatRoomId,
      userId,
    },
    select: {
      lastSeenAt: true,
    },
  });

  const unreadCount = await prisma.chatMessage.count({
    where: {
      chatRoomId,
      createdAt: {
        gt: participant?.lastSeenAt || new Date(0),
      },
      senderId: {
        not: userId,
      },
    },
  });

  return unreadCount;
}
