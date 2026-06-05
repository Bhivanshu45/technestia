import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CollaborationStatus } from "@prisma/client";
import { checkPermission } from "@/utils/checkPermission";
import { createActivityAndNotify } from "@/lib/activityNotificationRealtime";
import logger from "@/lib/logger";

export async function DELETE(req: Request, context: { params: { projectId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session?.user || !session.user.id) {
    logger.warn("project.remove_collab.unauthorized");
    return NextResponse.json({
        success: false,
        message: "Unauthorized",
      },{ status: 401 });
  }

  const userId = Number(session.user.id);
  const { projectId } = await context.params;
  const decodedProjectId = decodeURIComponent(projectId);
  const projectIdNumber = Number(decodedProjectId);

  if (!projectIdNumber || isNaN(Number(projectIdNumber))) {
    logger.warn("project.remove_collab.invalid_project_id", { projectId });
    return NextResponse.json(
      { success: false, message: "Invalid project ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const targetUserId = Number(body.userId);
    if (isNaN(targetUserId)) {
        logger.warn("project.remove_collab.invalid_target_user", { userId, projectId: projectIdNumber, targetUserId: body.userId });
        return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
        );
    }

    if(userId === targetUserId){
      logger.warn("project.remove_collab.self_remove_blocked", { userId, projectId: projectIdNumber });
        return NextResponse.json(
            { success: false, message: "You cannot remove yourself from the project." },
            { status: 403 }
        );
    }

  try {
    logger.info("project.remove_collab.request_received", { userId, projectId: projectIdNumber, targetUserId });
    const project = await prisma.project.findUnique({
      where: { id: projectIdNumber },
      select: {
        id: true,
        userId: true,
        collaborations: {
          where: {
            userId: { in: [userId, targetUserId] },
            status: CollaborationStatus.ACCEPTED,
          },
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
      logger.warn("project.remove_collab.project_not_found", { userId, projectId: projectIdNumber });
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    if (project.userId === targetUserId) {
      logger.warn("project.remove_collab.owner_blocked", { userId, projectId: projectIdNumber, targetUserId });
      return NextResponse.json(
        { success: false, message: "Owner cannot be removed from the project" },
        { status: 403 }
      );
    }

    // check if target user is a collaborator
    const isTargetCollaborator = project.collaborations.some(
      (collab) =>
        collab.userId === targetUserId &&
        collab.status === CollaborationStatus.ACCEPTED
    );

    if (!isTargetCollaborator) {
      logger.warn("project.remove_collab.target_not_collaborator", { userId, projectId: projectIdNumber, targetUserId });
      return NextResponse.json(
        {
          success: false,
          message: "Target user is not a collaborator on this project.",
        },
        { status: 404 }
      );
    }

    // check if remover is a collaborator
    const isRemoverCollaborator = project.collaborations.some((collab) =>
            collab.userId === userId &&
            collab.status === CollaborationStatus.ACCEPTED
    );
    const isOwner = project.userId === userId;

    if (!isOwner && !isRemoverCollaborator) {
      logger.warn("project.remove_collab.forbidden", { userId, projectId: projectIdNumber, targetUserId });
      return NextResponse.json({
          success: false,
          message: "You are not a contributor on this project.",
        },{ status: 403 }
      );
    }

    // check if user has permission to remove collaborator
    const hasPermission = checkPermission({project, userId, targetUserId});
    if (!hasPermission) {
      logger.warn("project.remove_collab.permission_denied", { userId, projectId: projectIdNumber, targetUserId });
      return NextResponse.json({
          success: false,
          message: "You do not have permission to remove this collaborator.",
        }, { status: 403 }
      );
    }

    await prisma.collaboration.deleteMany({
      where: {
        projectId: projectIdNumber,
        userId: targetUserId,
        status: CollaborationStatus.ACCEPTED,
      },
    });

    await createActivityAndNotify(
      {
        userId,
        projectId: projectIdNumber,
        actionType: "REMOVED_FORM_PROJECT",
        description: `Removed user ${targetUserId} from project ${projectIdNumber}`,
        targetId: targetUserId,
        targetType: "User",
      },
      {
        recipientUserIds: [targetUserId, project.userId],
      }
    );

    logger.info("project.remove_collab.success", { userId, projectId: projectIdNumber, targetUserId });

    return NextResponse.json(
      {
        success: true,
        message: "Collaborator has been successfully removed from the project.",
      },
      { status: 200 }
    );
  }catch(error){
    logger.error("project.remove_collab.error", { error: String(error), userId, projectId: projectIdNumber, targetUserId });
    return NextResponse.json(
      { success: false, message: "An error occurred while removing the collaborator." },
      { status: 500 }
    );
  }

  
}