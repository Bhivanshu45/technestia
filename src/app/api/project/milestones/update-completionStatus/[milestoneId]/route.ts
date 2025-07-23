import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CollaborationStatus, CompletionStatus, UpdateRequestStatus } from "@prisma/client";

const updateCompletionSchema = z.object({
    completionStatus: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED","SKIPPED"])
});

export async function PATCH(req: Request, context: { params: { milestoneId: string } }) {
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
    const parsedData = updateCompletionSchema.safeParse(body);
    if(!parsedData.success) {
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
        const milestone = await prisma.milestone.findUnique({
            where: { id: milestoneIdNumber },
            include: { project: true }
        });

        if(!milestone) {
            return NextResponse.json(
                { success: false, message: "Milestone not found" },
                { status: 404 }
            );
        }

        if(milestone.updateRequest === UpdateRequestStatus.PENDING){
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
            return NextResponse.json({
                success: false,
                message: "You do not have permission to update this milestone."
            }, { status: 403 });
        }

        const isFullAccessCollab = isCollaborator?.accessLevel === "FULL";

        if(!isFullAccessCollab && completionStatus === CompletionStatus.SKIPPED){
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
        

        await prisma.activityLog.create({
          data: {
            userId,
            projectId: milestone.projectId,
            actionType: "UPDATE_MILESTONE",
            description: `Milestone "${milestone.title}" status ${(isCollaborator || isOwner) ? "updated successfully" : "update request forwarded."}`,
            targetId: milestoneIdNumber,
            targetType: "MILESTONE",
          },
        });

        return NextResponse.json({
            success: true,
            message: "Milestone status updated successfully",
            milestone: updatedMilestone
        },{status: 200})

    } catch (error) {
        console.error("Error updating milestone completion status:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}