import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CollaborationStatus } from "@prisma/client";

export async function GET(_req: Request, context: { params: { milestoneId: string } }) {
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

    if (!milestoneIdNumber || isNaN(Number(milestoneIdNumber))) {
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
            include: {
                project: true,
                createdBy: true
            }
        });

        if (!milestone) {
            return NextResponse.json({
                success: false,
                message: "Milestone not found"
            }, { status: 404 });
        }

        const isOwner = milestone.project.userId === userId;
        const isCollaborator = await prisma.collaboration.findFirst({
          where: {
            projectId: milestone.projectId,
            userId,
            status: CollaborationStatus.ACCEPTED,
          },
          select: { id: true },
        });

        // Check if the user has access to the milestone
        if (!isOwner && !isCollaborator && !milestone.isPublic) {
            return NextResponse.json({
                success: false,
                message: "Access denied to this milestone"
            }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            message: "Milestone details fetched successfully",
            milestone: milestone
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching milestone details:", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error"
        }, { status: 500 });
    }
}