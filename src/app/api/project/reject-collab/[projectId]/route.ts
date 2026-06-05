import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccessLevel, CollaborationStatus } from "@prisma/client";
import { emitCollabSyncToUsers } from "@/lib/collabRealtime";
import { createActivityAndNotify } from "@/lib/activityNotificationRealtime";
import logger from "@/lib/logger";

export async function PATCH(
  req: Request,
  context: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    logger.warn("project.reject_collab.unauthorized");
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
    logger.warn("project.reject_collab.invalid_project_id", { projectId });
    return NextResponse.json(
      { success: false, message: "Invalid project ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const targetCollabId = Number(body.targetCollabId);

  if (isNaN(targetCollabId)) {
    logger.warn("project.reject_collab.invalid_collab_id", { projectId: projectIdNumber, targetCollabId: body.targetCollabId });
    return NextResponse.json(
      { success: false, message: "Invalid collaboration ID" },
      { status: 400 }
    );
  }

  try {
    logger.info("project.reject_collab.request_received", { userId, projectId: projectIdNumber, targetCollabId });
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
      logger.warn("project.reject_collab.project_not_found", { userId, projectId: projectIdNumber });
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const isOwner = userId === project.userId;
    const isFullAccessCollab = project.collaborations.length > 0;

    if (!isOwner && !isFullAccessCollab) {
      logger.warn("project.reject_collab.forbidden", { userId, projectId: projectIdNumber });
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to reject collaborations",
        },
        { status: 403 }
      );
    }

    const collab = await prisma.collaboration.findFirst({
      where: {
        id: targetCollabId,
        projectId: projectIdNumber,
        status: CollaborationStatus.PENDING,
        invitedBy: null
      },
    });

    if (!collab) {
      logger.warn("project.reject_collab.request_not_found", { userId, projectId: projectIdNumber, targetCollabId });
      return NextResponse.json(
        {
          success: false,
          message: "No pending collaboration request found",
        },
        { status: 404 }
      );
    }

    const updatedCollab = await prisma.collaboration.update({
      where: { id: collab.id },
      data: {
        status: CollaborationStatus.REJECTED,
        lastUpdatedAt: new Date(),
      },
    });

    logger.info("project.reject_collab.success", { userId, projectId: projectIdNumber, targetCollabId, collaboratorUserId: collab.userId });

    await createActivityAndNotify({
      userId,
      projectId: projectIdNumber,
      actionType: "REJECT_COLLABORATION",
      description: `Rejected collaboration request of user ID ${collab.userId}`,
      targetId: collab.id,
      targetType: "Collaboration",
    }, {
      recipientUserIds: [collab.userId],
    });

    emitCollabSyncToUsers([userId, collab.userId], {
      type: "REQUEST_REJECTED",
      projectId: projectIdNumber,
      collaborationId: collab.id,
      status: "REJECTED",
      actorUserId: userId,
      targetUserId: collab.userId,
      invitedBy: null,
      updatedAt: updatedCollab.lastUpdatedAt.toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Collaboration request rejected successfully",
      },
      { status: 200 }
          logger.error("project.reject_collab.error", { error: String(error), userId, projectId: projectIdNumber, targetCollabId });
  } catch (error) {
    logger.error("Reject Collab Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
