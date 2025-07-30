import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  context: { params: { feedbackId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const { feedbackId } = await context.params;
  const decodedFeedbackId = decodeURIComponent(feedbackId);
  const feedbackIdNumber = Number(decodedFeedbackId);
  if (!feedbackIdNumber || isNaN(feedbackIdNumber)) {
    return NextResponse.json(
      { success: false, message: "Invalid feedback ID" },
      { status: 400 }
    );
  }

  const userId = Number(session.user.id);
  if (isNaN(userId)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid user ID",
      },
      { status: 400 }
    );
  }

  try {

    const existing = await prisma.feedback.findFirst({
      where: { id: feedbackIdNumber },
    });
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "No such feedback exists",
        },
        { status: 400 }
      );
    }

    if( existing.createdById !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to delete this feedback",
        },
        { status: 403 }
      );
    }

    await prisma.feedback.delete({
        where: {id:feedbackIdNumber}
    }) 

    return NextResponse.json(
      {
        success: true,
        message: "Feedback deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error in deleting feedback" },
      { status: 500 }
    );
  }
}
