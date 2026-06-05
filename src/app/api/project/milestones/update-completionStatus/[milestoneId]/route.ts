import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CollaborationStatus, CompletionStatus, UpdateRequestStatus } from "@prisma/client";
import { createActivityAndNotify } from "@/lib/activityNotificationRealtime";
import logger from "@/lib/logger";

const updateCompletionSchema = z.object({
    completionStatus: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED","SKIPPED"])
});

export async function PATCH(req: Request, context: { params: { milestoneId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        logger.warn("project.milestones.update_completion.unauthorized");
        return NextResponse.json({
            success: false,
            message: "Unauthorized"
        }, { status: 401 });
    }

    const { milestoneId } = await context.params;
    const decodedMilestoneId = decodeURIComponent(milestoneId);
    const milestoneIdNumber = Number(decodedMilestoneId);
    if (!milestoneIdNumber || isNaN(milestoneIdNumber)) {
        logger.warn("project.milestones.update_completion.invalid_milestone_id", { milestoneId });
        return NextResponse.json(
            { success: false, message: "Invalid milestone ID" },
            { status: 400 }
        );
    }
    
    const userId = Number(session.user.id);
    if (isNaN(userId)) {
        logger.warn("project.milestones.update_completion.invalid_user_id", { userId: session.user.id });
        return NextResponse.json({
            success: false,
            message: "Invalid user ID"
        }, { status: 400 });
    }

    const body = await req.json();
    const parsedData = updateCompletionSchema.safeParse(body);
    if(!parsedData.success) {
        logger.warn("project.milestones.update_completion.validation_failed", { errors: parsedData.error.flatten().fieldErrors });
        return NextResponse.json(
            {
                success: false,
                message: "Invalid milestone data",
                errors: parsedData.error.flatten().fieldErrors,
            },
            { status: 400 }
        );
    }

    const { completionStatus } = parsedData.data;

    try{
        logger.info("project.milestones.update_completion.request_received", { userId, milestoneId: milestoneIdNumber, completionStatus });
        const milestone = await prisma.milestone.findUnique({
            where: { id: milestoneIdNumber },
            include: { project: true }
        });

        if(!milestone) {
            logger.warn("project.milestones.update_completion.milestone_not_found", { userId, milestoneId: milestoneIdNumber });
            return NextResponse.json(
                { success: false, message: "Milestone not found" },
                { status: 404 }
            );
        }

        if(milestone.updateRequest === UpdateRequestStatus.PENDING){
                        logger.warn("project.milestones.update_completion.pending_request_exists", { userId, milestoneId: milestoneIdNumber });
            return NextResponse.json(
              { success: false, message: "Milestone nalredy has a pending Request" },
              { status: 400 }
            );
        }

        const isOwner = milestone.project.userId === userId;
        const isCollaborator = await prisma.collaboration.findFirst({
            where: {
                projectId: milestone.projectId,
                userId,
                status: CollaborationStatus.ACCEPTED
            }
        });

        if(!isOwner && !isCollaborator) {
            logger.warn("project.milestones.update_completion.forbidden", { userId, milestoneId: milestoneIdNumber });
            return NextResponse.json({
                success: false,
                message: "You do not have permission to update this milestone."
            }, { status: 403 });
        }

        const isFullAccessCollab = isCollaborator?.accessLevel === "FULL";

        if(!isFullAccessCollab && completionStatus === CompletionStatus.SKIPPED){
            logger.warn("project.milestones.update_completion.skip_forbidden", { userId, milestoneId: milestoneIdNumber });
            return NextResponse.json({
                success: false,
                message: "You do not have permission to skip milestones.",
              },{ status: 403 });
        }
        
        const updatedMilestone = await prisma.milestone.update({
            where: { id: milestoneIdNumber },
            data: {
                completionStatus,
                updateRequest: (isOwner || isFullAccessCollab) ? "APPROVED" : "PENDING"
            }
        });
        

                await createActivityAndNotify({
                    userId,
                    projectId: milestone.projectId,
                    actionType: "UPDATE_MILESTONE",
                    description: `Milestone "${milestone.title}" status ${(isCollaborator || isOwner) ? "updated successfully" : "update request forwarded."}`,
                    targetId: milestoneIdNumber,
                    targetType: "MILESTONE",
                });

        logger.info("project.milestones.update_completion.success", { userId, milestoneId: milestoneIdNumber, projectId: milestone.projectId, completionStatus });

        return NextResponse.json({
            success: true,
            message: "Milestone status updated successfully",
            milestone: updatedMilestone
        },{status: 200})

    } catch (error) {
        logger.error("project.milestones.update_completion.error", { error: String(error), userId, milestoneId: milestoneIdNumber });
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}