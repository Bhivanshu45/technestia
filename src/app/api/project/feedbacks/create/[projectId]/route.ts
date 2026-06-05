import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createActivityAndNotify } from "@/lib/activityNotificationRealtime";
import logger from "@/lib/logger";

export const createFeedbackSchema = z.object({
    content: z.string().min(1, "Content is required"),
    rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
})

export async function POST(req: Request, context: { params: { projectId: string } }){
    const session = await getServerSession(authOptions);
        if(!session || !session.user || !session.user.id) {
        logger.warn("project.feedbacks.create.unauthorized");
            return NextResponse.json({
                success: false,
                message: "Unauthorized"
            }, { status: 401 });
        }

    const { projectId } = await context.params;
    const decodedProjectId = decodeURIComponent(projectId);
    const projectIdNumber = Number(decodedProjectId);
    if (!projectIdNumber || isNaN(projectIdNumber)) {
      logger.warn("project.feedbacks.create.invalid_project_id", { projectId });
        return NextResponse.json(
            { success: false, message: "Invalid project ID" },
            { status: 400 }
        );
    }

    const userId = Number(session.user.id);
    if (isNaN(userId)) {
      logger.warn("project.feedbacks.create.invalid_user_id", { userId: session.user.id });
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
      logger.warn("project.feedbacks.create.validation_failed", { errors: parsedData.error.flatten().fieldErrors });
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
    try{
      logger.info("project.feedbacks.create.request_received", { userId, projectId: projectIdNumber, rating });
        // anyone can create feedback for a project
        const project = await prisma.project.findUnique({
            where: { id: projectIdNumber }
        })

        if(!project) {
        logger.warn("project.feedbacks.create.project_not_found", { userId, projectId: projectIdNumber });
            return NextResponse.json(
                { success: false, message: "Project not found" },
                { status: 404 }
            );
        }

        const existing = await prisma.feedback.findFirst({
          where: { projectId: projectIdNumber, createdById: userId },
        });
        if (existing) {
          logger.warn("project.feedbacks.create.already_exists", { userId, projectId: projectIdNumber, feedbackId: existing.id });
          return NextResponse.json(
            {
              success: false,
              message: "You have already submitted feedback for this project",
            },
            { status: 400 }
          );
        }


        const feedback = await prisma.feedback.create({
            data: {
                content,
                rating,
                projectId: projectIdNumber,
                createdById: userId,
            },
        });

        await createActivityAndNotify({
          projectId: projectIdNumber,
          userId,
          actionType: "CREATE_FEEDBACK",
          targetId: projectIdNumber,
          targetType: "Feedback",
          description: `User ${session.user.name} created feedback for project ${projectIdNumber}`,
        });

        logger.info("project.feedbacks.create.success", { userId, projectId: projectIdNumber, feedbackId: feedback.id });

        return NextResponse.json(
          {
            success: true,
            message: "Feedback created successfully",
            feedback: {
              id: feedback.id,
              content: feedback.content,
              rating: feedback.rating,
              createdAt: feedback.createdAt,
            },
          },
          { status: 200 }
        );
    }catch(error){
        logger.error("project.feedbacks.create.error", { error: String(error), userId, projectId: projectIdNumber });
        return NextResponse.json(
            { success: false, message: "Error creating feedback" },
            { status: 500 }
        );
    }
}