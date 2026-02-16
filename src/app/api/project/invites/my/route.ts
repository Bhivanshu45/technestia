import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CollaborationStatus } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = Number(session.user.id);
  if (isNaN(userId)) {
    return NextResponse.json(
      { success: false, message: "Invalid user ID" },
      { status: 400 }
    );
  }

  try {
    const invites = await prisma.collaboration.findMany({
      where: {
        userId,
        status: CollaborationStatus.PENDING,
        invitedBy: { not: null },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            techStack: true,
            tags: true,
            screenshots: true,
            uploadedAt: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Invites fetched successfully",
        invites,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET_MY_INVITES_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
