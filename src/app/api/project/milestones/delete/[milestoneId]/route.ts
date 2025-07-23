import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccessLevel, CollaborationStatus } from "@prisma/client";

export async function DELETE(_req: Request, context: { params: { milestoneId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({
            success: false,
            message: "Unauthorized"
        }, { status: 401 });
    }

    const { milestoneId } = await context.params;
    const decodedMilestoneId = decodeURIComponent(milestoneId);
    const milestoneIdNumber = Number(decodedMilestoneId);
    if (!milestoneIdNumber || isNaN(milestoneIdNumber)) {
        return NextResponse.json(
            { success: false, message: "Invalid milestone ID" },
            { status: 400 }
        );
    }

    const userId = Number(session.user.id);
    if (isNaN(userId)) {
        return NextResponse.json({
            success: false,
            message: "Invalid user ID"
        }, { status: 400 });
    }

    try {
        const milestone = await prisma.milestone.findUnique({
            where: { id: milestoneIdNumber },
            include: { project: true }
        });

        if (!milestone) {
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
            return NextResponse.json(
                { success: false, message: "You don't have access to delete this milestone" },
                { status: 403 }
            );
        }

        await prisma.milestone.delete({
            where: { id: milestoneIdNumber }
        });

        await prisma.activityLog.create({
          data: {
            userId,
            projectId: milestone.projectId,
            actionType: "DELETE_MILESTONE",
            description: `Milestone "${milestone.title}" deleted by ${session.user.email || "a user"}.`,
            targetId: milestone.projectId,
            targetType: "MILESTONE",
          },
        });

        return NextResponse.json({
            success: true,
            message: "Milestone deleted successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Error deleting milestone:", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error"
        }, { status: 500 });
    }
}