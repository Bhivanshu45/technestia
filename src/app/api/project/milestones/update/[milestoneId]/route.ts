import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { updateMilestoneSchema } from "@/validations/milestoneSchemas/updateMilestoneSchema";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccessLevel, CollaborationStatus } from "@prisma/client";

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
    const parsedData = updateMilestoneSchema.safeParse(body);
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

    const { title, description, proofUrl = "" } = parsedData.data;

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

        await prisma.activityLog.create({
            data: {
                userId,
                projectId: milestone.projectId,
                actionType: "UPDATE_MILESTONE",
                description: `Milestone "${title}" updated successfully.`,
                targetId: milestoneIdNumber,
                targetType: "MILESTONE",
            }
        })

        return NextResponse.json(
            { success: true, message: "Milestone updated successfully", milestone: updatedMilestone },
            { status: 200 }
        );

    }catch(error) {
        console.error("Error updating milestone:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }

}