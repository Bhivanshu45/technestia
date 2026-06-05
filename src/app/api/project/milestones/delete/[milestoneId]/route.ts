import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccessLevel, CollaborationStatus } from "@prisma/client";
import { createActivityAndNotify } from "@/lib/activityNotificationRealtime";
import logger from "@/lib/logger";

export async function DELETE(_req: Request, context: { params: { milestoneId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        logger.warn("project.milestones.delete.unauthorized");
        return NextResponse.json({
            success: false,
            message: "Unauthorized"
        }, { status: 401 });
    }

    const { milestoneId } = await context.params;
    const decodedMilestoneId = decodeURIComponent(milestoneId);
    const milestoneIdNumber = Number(decodedMilestoneId);
    if (!milestoneIdNumber || isNaN(milestoneIdNumber)) {
        logger.warn("project.milestones.delete.invalid_milestone_id", { milestoneId });
        return NextResponse.json(
            { success: false, message: "Invalid milestone ID" },
            { status: 400 }
        );
    }

    const userId = Number(session.user.id);
    if (isNaN(userId)) {
        logger.warn("project.milestones.delete.invalid_user_id", { userId: session.user.id });
        return NextResponse.json({
            success: false,
            message: "Invalid user ID"
        }, { status: 400 });
    }

    try {
        logger.info("project.milestones.delete.request_received", { userId, milestoneId: milestoneIdNumber });
        const milestone = await prisma.milestone.findUnique({
            where: { id: milestoneIdNumber },
            include: { project: true }
        });

        if (!milestone) {
            logger.warn("project.milestones.delete.milestone_not_found", { userId, milestoneId: milestoneIdNumber });
            return NextResponse.json(
                { success: false, message: "Milestone not found" },
                { status: 404 }
            );
        }

        const isOwner = milestone.project.userId === userId;
        const isFullAccessCollab = await prisma.collaboration.findFirst({
            where: {                
                projectId: milestone.projectId,
                userId,
                status: CollaborationStatus.ACCEPTED,
                accessLevel: AccessLevel.FULL,
            },
            select: { id: true },
        });

        if (!isOwner && !isFullAccessCollab) {
            logger.warn("project.milestones.delete.forbidden", { userId, milestoneId: milestoneIdNumber });
            return NextResponse.json(
                { success: false, message: "You don't have access to delete this milestone" },
                { status: 403 }
            );
        }

        await prisma.milestone.delete({
            where: { id: milestoneIdNumber }
        });

                await createActivityAndNotify({
                    userId,
                    projectId: milestone.projectId,
                    actionType: "DELETE_MILESTONE",
                    description: `Milestone "${milestone.title}" deleted by ${session.user.email || "a user"}.`,
                    targetId: milestone.projectId,
                    targetType: "MILESTONE",
                });

        logger.info("project.milestones.delete.success", { userId, milestoneId: milestoneIdNumber, projectId: milestone.projectId });

        return NextResponse.json({
            success: true,
            message: "Milestone deleted successfully"
        }, { status: 200 });

    } catch (error) {
        logger.error("project.milestones.delete.error", { error: String(error), userId, milestoneId: milestoneIdNumber });
        return NextResponse.json({
            success: false,
            message: "Internal server error"
        }, { status: 500 });
    }
}