import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccessLevel, CollaborationStatus, UpdateRequestStatus } from "@prisma/client";
import { z } from "zod";

const approveCompletionStatus = z.object({
    updateRequest: z.enum(["APPROVED","REJECTED"])
})

export async function PUT(req: Request, context: { params: { milestoneId: string } }) {
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

    const body = await req.json();
    const parsedData = approveCompletionStatus.safeParse(body);
    if(!parsedData.success) {
        return NextResponse.json(
            {
                success: false,
                message: "Invalid approval request",
                errors: parsedData.error.flatten().fieldErrors,
            },
            { status: 400 }
        );
    }

    const { updateRequest } = parsedData.data;

    try{
        const milestone = await prisma.milestone.findUnique({
            where: { 
                id: milestoneIdNumber,
                updateRequest: UpdateRequestStatus.PENDING
             },
            include: { project: true }
        })

        if(!milestone) {
            return NextResponse.json(
                { success: false, message: "Update Request for Milestone not found" },
                { status: 404 }
            );
        }

        const isOwner = milestone.project.userId === userId;
        const isFullAccessCollab = await prisma.collaboration.findFirst({
            where: {
                projectId: milestone.projectId,
                userId,
                accessLevel: AccessLevel.FULL,
                status: CollaborationStatus.ACCEPTED
            }
        });

        if(!isOwner && !isFullAccessCollab) {
            return NextResponse.json({
                success: false,
                message: "You do not have permission to approve this milestone."
            }, { status: 403 });
        }

        const approvedStatus = await prisma.milestone.update({
            where: { id: milestoneIdNumber},
            data: {
                updateRequest
            }
        })

        await prisma.activityLog.create({
          data: {
            userId,
            projectId: milestone.projectId,
            actionType: "UPDATE_MILESTONE",
            description: `Milestone "${milestone.title}" completion status updated.`,
            targetId: milestoneIdNumber,
            targetType: "MILESTONE",
          },
        });

        return NextResponse.json({
            success: true,
            message: "Milestone update request approved successfully",
            milestone: approvedStatus
        },{status: 200})

    }catch (error) {
        console.error("Error approving milestone:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}