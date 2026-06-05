import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { updateMilestoneSchema } from "@/validations/milestoneSchemas/updateMilestoneSchema";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccessLevel, CollaborationStatus } from "@prisma/client";
import { createActivityAndNotify } from "@/lib/activityNotificationRealtime";
import logger from "@/lib/logger";

export async function PUT(req: Request, context: { params: { milestoneId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        logger.warn("project.milestones.update.unauthorized");
        return NextResponse.json({
            success: false,
            message: "Unauthorized"
        }, { status: 401 });
    }

    const { milestoneId } = await context.params;
    const decodedMilestoneId = decodeURIComponent(milestoneId);
    const milestoneIdNumber = Number(decodedMilestoneId);
    if (!milestoneIdNumber || isNaN(milestoneIdNumber)) {
        logger.warn("project.milestones.update.invalid_milestone_id", { milestoneId });
        return NextResponse.json(
            { success: false, message: "Invalid milestone ID" },
            { status: 400 }
        );
    }
    
    const userId = Number(session.user.id);
    if (isNaN(userId)) {
        logger.warn("project.milestones.update.invalid_user_id", { userId: session.user.id });
        return NextResponse.json({
            success: false,
            message: "Invalid user ID"
        }, { status: 400 });
    }

    const body = await req.json();
    const parsedData = updateMilestoneSchema.safeParse(body);
    if(!parsedData.success) {
        logger.warn("project.milestones.update.validation_failed", { errors: parsedData.error.flatten().fieldErrors });
        return NextResponse.json(
            {
                success: false,
                message: "Invalid milestone data",
                errors: parsedData.error.flatten().fieldErrors,
            },
            { status: 400 }
        );
    }

    const { title, description, proofUrl = "" } = parsedData.data;

    try{
        logger.info("project.milestones.update.request_received", { userId, milestoneId: milestoneIdNumber });
        const milestone = await prisma.milestone.findUnique({
            where: { id: milestoneIdNumber },
            include: { project: true }
        });

        if(!milestone) {
            logger.warn("project.milestones.update.milestone_not_found", { userId, milestoneId: milestoneIdNumber });
            return NextResponse.json(
                { success: false, message: "Milestone not found" },
                { status: 404 }
            );
        }
        const isOwner = milestone.project.userId === userId;
        const isCreator = milestone.createdById === userId;
        const isFullAccessCollab = await prisma.collaboration.findFirst({
            where: {
                projectId: milestone.projectId,
                userId,
                status: CollaborationStatus.ACCEPTED,
                accessLevel: AccessLevel.FULL
            }
        })

        const hasPermission = isOwner || isCreator || isFullAccessCollab;
        if(!hasPermission) {
            logger.warn("project.milestones.update.forbidden", { userId, milestoneId: milestoneIdNumber });
            return NextResponse.json({
                success: false,
                message: "You do not have permission to update this milestone."
            }, { status: 403 });
        }

        const updatedMilestone = await prisma.milestone.update({
            where: { id: milestoneIdNumber },
            data: {
                title,
                description,
                proofUrl
            }
        });

        await createActivityAndNotify({
            userId,
            projectId: milestone.projectId,
            actionType: "UPDATE_MILESTONE",
            description: `Milestone "${title}" updated successfully.`,
            targetId: milestoneIdNumber,
            targetType: "MILESTONE",
        });

        logger.info("project.milestones.update.success", { userId, milestoneId: milestoneIdNumber, projectId: milestone.projectId });

        return NextResponse.json(
            { success: true, message: "Milestone updated successfully", milestone: updatedMilestone },
            { status: 200 }
        );

    }catch(error) {
        logger.error("project.milestones.update.error", { error: String(error), userId, milestoneId: milestoneIdNumber });
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }

}