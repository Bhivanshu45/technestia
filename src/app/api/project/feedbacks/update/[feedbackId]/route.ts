import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createFeedbackSchema } from "../../create/[projectId]/route";

export async function PUT(
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
      { success: false, message: "Invalid project ID" },
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
  const body = await req.json();
  const parsedData = createFeedbackSchema.safeParse(body);
  if (!parsedData.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid feedback data",
        errors: parsedData.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }
  const { content, rating } = parsedData.data;

  try {
    const existingFeedback = await prisma.feedback.findUnique({
      where: { id: feedbackIdNumber },
      select: {
        id: true,
        content: true,
        rating: true,
        createdById: true,
        projectId: true,
        reactions: {
          select: { id: true },
        },
      },
    });

    if (!existingFeedback) {
      return NextResponse.json(
        { success: false, message: "Feedback not found" },
        { status: 404 }
      );
    }

    if (existingFeedback.createdById !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not allowed to update this feedback",
        },
        { status: 403 }
      );
    }

    // check if the reactions on the feedback are empty
    if (existingFeedback.reactions.length > 0) {
      return NextResponse.json({
          success: false,
          message: "Cannot update feedback with existing reactions",
        },{ status: 400 }
      );
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackIdNumber },
      data: {
        content,
        rating,
        },
      select: {
        id: true,
        content: true,
        rating: true,
        createdById: true,
        projectId: true,
        },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Feedback updated successfully",
        feedback: updatedFeedback,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error creating feedback" },
      { status: 500 }
    );
  }
}
