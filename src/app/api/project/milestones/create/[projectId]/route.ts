import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccessLevel, CollaborationStatus,UpdateRequestStatus } from "@prisma/client";
import { createMilestoneSchema } from "@/validations/milestoneSchemas/createMilestoneSchema";

export async function POST(req: Request, context: { params: { projectId: string } }) {
    const session = await getServerSession(authOptions);
    if(!session || !session.user || !session.user.id) {
        return NextResponse.json({
            success: false,
            message: "Unauthorized"
        }, { status: 401 });
    }

    const { projectId } = await context.params;
    const decodedProjectId = decodeURIComponent(projectId);
    const projectIdNumber = Number(decodedProjectId);
    if (!projectIdNumber || isNaN(projectIdNumber)) {
        return NextResponse.json(
            { success: false, message: "Invalid project ID" },
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
    const parsedData = createMilestoneSchema.safeParse(body);
    if (!parsedData.success) {
        return NextResponse.json(
            {
                success: false,
                message: "Invalid milestone data",
                errors: parsedData.error.flatten().fieldErrors,
            },
            { status: 400 }
        );
    }
    
    const {
      title,
      description,
      completionStatus = "NOT_STARTED",
      updateRequest = "NO_REQUEST",
      proofUrl,
      isPublic = false,
    } = parsedData.data;

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectIdNumber },
            include: {
                collaborations: {
                    where: { userId, status: CollaborationStatus.ACCEPTED },
                    select: { 
                        id: true,
                        userId: true,
                        status: true,
                        accessLevel: true,
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json({
                success: false,
                message: "Project not found"
            }, { status: 404 });
        }

        const isOwner = project.userId === userId;
        const collaborator = project.collaborations.find(
            (collab) => collab.userId === userId && collab.status === CollaborationStatus.ACCEPTED
        );

        if(!isOwner && !collaborator) {
            return NextResponse.json({
                success: false,
                message: "You do not have permission to create milestones for this project."
            }, { status: 403 });
        }
        const isFullAccessCollab = collaborator?.accessLevel === AccessLevel.FULL;
        if(!isFullAccessCollab) {
            return NextResponse.json({
                success: false,
                message: "You do not have permission to create milestones for this project."
            }, { status: 403 });
        }

        const createdMilestone = await prisma.milestone.create({
            data: {
                title,
                description,
                projectId: projectIdNumber,
                createdById: userId,
                completionStatus,
                updateRequest: UpdateRequestStatus.NO_REQUEST,
                proofUrl: proofUrl || "",
                isPublic, 
            }
        })

        if (!createdMilestone) {
            return NextResponse.json({
                success: false,
                message: "Failed to create milestone"
            }, { status: 500 });
        }

        await prisma.activityLog.create({
          data: {
            userId,
            projectId: projectIdNumber,
            actionType: "CREATE_MILESTONE",
            description: `Created new milestone \"${createdMilestone.title}\"`,
            targetId: createdMilestone.id,
            targetType: "Milestone",
          },
        });

        return NextResponse.json({
            success: true,
            message: "Milestone created successfully",
            milestone: createdMilestone
        }, { status: 201 });

    } catch (error) {
        console.error("Error fetching milestones:", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error"
        }, { status: 500 });
    }
}