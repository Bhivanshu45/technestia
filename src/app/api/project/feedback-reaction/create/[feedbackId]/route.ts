import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reactionSchema = z.object({
  reactionType: z.enum(["LIKE", "LOVE", "LAUGH", "WOW", "SAD", "ANGRY"]),
});

export async function POST(
  req: Request,
  context: { params: { feedbackId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session?.user || !session.user.id) {
    return NextResponse.json({ success: false,message: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const { feedbackId } = await context.params;
  const feedbackIdNumber = Number(decodeURIComponent(feedbackId));

  if (!feedbackIdNumber || isNaN(feedbackIdNumber)) {
    return NextResponse.json(
      { success: false,message: "Invalid feedback ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false,message: "Invalid input", errors: parsed.error.errors },
      { status: 400 }
    );
  }

  const { reactionType } = parsed.data;
  try {
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackIdNumber },
    });

    if (!feedback) {
      return NextResponse.json(
        { 
          success: false,
          message: "Feedback not found" },
        { status: 404 }
      );
    }

    const existingReaction = await prisma.feedbackReaction.findFirst({
      where: {
        feedbackId: feedbackIdNumber,
        userId: userId,
      }
    })

    if (existingReaction) {
      const updatedReaction = await prisma.feedbackReaction.update({
        where: { id: existingReaction.id },
        data: {
          type: reactionType,
          createdAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Reaction updated",
          data: updatedReaction,
        },
        { status: 200 }
      );
  
   }

   const newReaction = await prisma.feedbackReaction.create({
     data: {
       feedbackId: feedbackIdNumber,
       userId,
       type: reactionType,
     },
   });

   await prisma.activityLog.create({
     data: {
       projectId: feedback.projectId,
       userId: userId,
       actionType: "REACT_FEEDBACK",
       targetId: feedbackIdNumber,
       targetType: "FEEDBACK",
       description: `User reacted to feedback with ${reactionType}`,
     },
   });

   return NextResponse.json(
     {
       success: true,
       message: "Reaction recorded",
       data: newReaction,
     },
     { status: 201 }
   );
  } catch (error) {
    console.error("[FEEDBACK_REACTION_POST]", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
