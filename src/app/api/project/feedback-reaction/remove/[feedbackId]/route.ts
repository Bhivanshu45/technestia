import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  context: { params: { feedbackId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const { feedbackId } = await context.params;
  const feedbackIdNumber = Number(decodeURIComponent(feedbackId));

  if (!feedbackIdNumber || isNaN(feedbackIdNumber)) {
    return NextResponse.json(
      { message: "Invalid feedback ID" },
      { status: 400 }
    );
  }

  try {
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackIdNumber },
    });

    if (!feedback) {
      return NextResponse.json(
        {
          success: false,
          message: "Feedback not found",
        },
        { status: 404 }
      );
    }

    const existingReaction = await prisma.feedbackReaction.findFirst({
      where: {
        feedbackId: feedbackIdNumber,
        userId,
      },
    });

    if (!existingReaction) {
      return NextResponse.json(
        {
          success: false,
          message: "No reaction found for this feedback by the user",
        },
        { status: 404 }
      );
    }

    await prisma.feedbackReaction.delete({
      where: { id: existingReaction.id },
    });

    return NextResponse.json(
      { success: true, message: "Reaction removed" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[FEEDBACK_REACTION_POST]", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
