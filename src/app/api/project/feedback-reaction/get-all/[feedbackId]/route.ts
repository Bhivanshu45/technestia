import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: { feedbackId: string } }
) {
  try {
    const { feedbackId } = await context.params;

    const feedbackIdNumber = Number(feedbackId);
    if (isNaN(feedbackIdNumber)) {
      return NextResponse.json(
        { success: false, message: "Invalid feedback ID" },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackIdNumber },
      select: { id: true },
    });

    if (!feedback) {
      return NextResponse.json(
        { success: false, message: "Feedback not found" },
        { status: 404 }
      );
    }

    const reactions = await prisma.feedbackReaction.findMany({
      where: { feedbackId: feedbackIdNumber },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const reactionCounts = await prisma.feedbackReaction.groupBy({
      by: ["type"],
      where: { feedbackId: feedbackIdNumber },
      _count: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Reactions fetched successfully",
        data: {
          reactions,
          counts: reactionCounts.map((r) => ({
            type: r.type,
            count: r._count,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[FETCH_FEEDBACK_REACTIONS]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
