import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccessLevel, CollaborationStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  context: { params: { projectId: string } }
) {
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
  const targetCollabId = parseInt(body.targetCollabId);

  if (isNaN(targetCollabId)) {
    return NextResponse.json(
      {
        success: false,
        message: "Did not find target collaboration ID",
      },
      { status: 400 }
    );
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectIdNumber },
      select: { 
        userId: true,
        collaborations: {
            where: {userId, status: CollaborationStatus.ACCEPTED , accessLevel: AccessLevel.FULL },
            select: {
                id: true
            }
        }
     },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const isOwner = userId === project.userId;

    const isFullAccessCollab = project.collaborations.length > 0;

    if (!isOwner && !isFullAccessCollab) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to accept collaborations",
        },
        { status: 403 }
      );
    }

    const collab = await prisma.collaboration.findFirst({
      where: {
        id: targetCollabId,
        projectId: projectIdNumber,
        status: CollaborationStatus.PENDING,
        invitedBy: null,
      },
    });

    if (!collab) {
      return NextResponse.json(
        {
          success: false,
          message: "No pending collaboration request found",
        },
        { status: 404 }
      );
    }

    await prisma.collaboration.update({
      where: { id: collab.id },
      data: {
        status: CollaborationStatus.ACCEPTED,
        lastUpdatedAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: userId,
        projectId: projectIdNumber,
        actionType: "APPROVE_COLLABORATION",
        description: `Approved collaboration request of user ID ${collab.userId}`,
        targetId: collab.id,
        targetType: "Collaboration",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Collaboration request accepted successfully",
      collaboratorUserId: collab.userId,
    },{status: 200});

  } catch (error) {
    console.error("Accept Collab Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
