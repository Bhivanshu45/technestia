import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccessLevel, CollaborationStatus } from "@prisma/client";

export async function POST(req: Request, context: { params: { projectId: string } }) {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
        return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
        );
    }
    
    const userId = Number(session.user.id);
    const { projectId } = await context.params;
    const decodedProjectId = decodeURIComponent(projectId);
    const projectIdNumber = Number(decodedProjectId);

    if (!projectIdNumber || isNaN(Number(projectIdNumber))) {
      return NextResponse.json(
        { success: false, message: "Invalid project ID" },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const giveAccess = body.giveAccess;
    if (!giveAccess || (giveAccess !== "FULL" && giveAccess !== "LIMITED")) {
      return NextResponse.json({
        success: false,
        message: "Invalid access level"
      });
    }
    const targetUserId = Number(body.userId);

    if (isNaN(targetUserId)) {
        return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
        );
    }

    if (userId === targetUserId) {
        return NextResponse.json(
            { success: false, message: "You cannot invite yourself to the project." },
            { status: 403 }
        );
    }
    
    try {
        const project = await prisma.project.findUnique({
        where: { id: projectIdNumber },
        select: {
            userId: true,
            collaborations: {
            where: {
                userId,
                status: CollaborationStatus.ACCEPTED,
                accessLevel: AccessLevel.FULL,
            },
            select: { id: true },
            },
        },
        });
    
        if (!project) {
        return NextResponse.json(
            { success: false, message: "Project not found" },
            { status: 404 }
        );
        }

        if(project.userId == targetUserId){
            return NextResponse.json(
                { success: false, message: "Project owner cannot be invited" },
                { status: 403 }
            );
        }
    
        const isOwner = userId === project.userId;
        const isFullAccessCollab = project.collaborations.length > 0;
    
        if (!isOwner && !isFullAccessCollab) {
        return NextResponse.json(
            { success: false, message: "Forbidden: Access Denied" },
            { status: 403 }
        );
        }


        const existingCollab = await prisma.collaboration.findFirst({
            where: {
                projectId: projectIdNumber,
                userId: targetUserId,
                status: { in: [CollaborationStatus.PENDING, CollaborationStatus.ACCEPTED] },
            },
        });

        if (existingCollab) {
          return NextResponse.json(
            {
              success: false,
              message: `User already has a ${existingCollab.status.toLowerCase()} collaboration`,
            },
            { status: 409 }
          );
        }
    
        const createInvite = await prisma.collaboration.create({
            data: {
                projectId: projectIdNumber,
                userId: targetUserId,
                invitedBy: userId,
                status: CollaborationStatus.PENDING,
                accessLevel: giveAccess === "FULL" ? AccessLevel.FULL : AccessLevel.LIMITED,
            }
        })

        await prisma.activityLog.create({
          data: {
            userId: userId,
            projectId: projectIdNumber,
            actionType: "REQUEST_COLLABORATION",
            description: `Invited user ${targetUserId} to collaborate`,
            targetId: createInvite.id,
            targetType: "Collaboration",
          },
        });
    
        return NextResponse.json(
        { success: true, message: "Collaboration invitation sent", inviteRequest: createInvite },
        { status: 200 }
        );

    } catch (error) {
        console.error("Error inviting collaborator :", error);
        return NextResponse.json(
        { success: false, message: "Internal server error" },
        { status: 500 }
        );
    }
}