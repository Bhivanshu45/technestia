import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { CollaborationStatus } from "@prisma/client";
import { createActivityAndNotify } from "@/lib/activityNotificationRealtime";
import logger from "@/lib/logger";

export async function DELETE(_req: Request, context: { params: { projectId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session?.user || !session.user.id) {
    logger.warn("project.leave_collab.unauthorized");
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const userId = Number(session.user.id);
  const { projectId } = await context.params;
  const decodedProjectId = decodeURIComponent(projectId);
  const projectIdNumber = Number(decodedProjectId);

  if (!projectIdNumber || isNaN(Number(projectIdNumber))) {
    logger.warn("project.leave_collab.invalid_project_id", { projectId });
    return NextResponse.json(
      { success: false, message: "Invalid project ID" },
      { status: 400 }
    );
  }

  try {
    logger.info("project.leave_collab.request_received", { userId, projectId: projectIdNumber });
    const project = await prisma.project.findUnique({
      where: { id: projectIdNumber },
      select: {
        id: true,
        userId: true,
        collaborations: {
          where: {
            userId,
            status: CollaborationStatus.ACCEPTED,
          },
          select: {
            id: true,
            userId: true,
            status: true,
          },
        }
      }
    });

    if (!project) {
      logger.warn("project.leave_collab.project_not_found", { userId, projectId: projectIdNumber });
      return NextResponse.json(
        { success: false, 
          message: "Project not found" },
        { status: 404 }
      );
    }

    if (project.userId === userId) {
      logger.warn("project.leave_collab.owner_blocked", { userId, projectId: projectIdNumber });
      return NextResponse.json(
        { message: "Owner cannot leave the project" },
        { status: 403 }
      );
    }

    const isCollaborator = project.collaborations.length > 0;

    if(!isCollaborator){
      logger.warn("project.leave_collab.not_a_collaborator", { userId, projectId: projectIdNumber });
      return NextResponse.json(
        { success: false, message: "You are not a collaborator on this project." },
        { status: 404 }
      );
    }

    // Remove the user from the project collaborations
    await prisma.collaboration.delete({
      where: {
        id: project.collaborations[0].id,
      },
    });

    await createActivityAndNotify({
      userId,
      projectId: projectIdNumber,
      targetId: projectIdNumber,
      targetType: "Collaboration",
      actionType: "LEAVE_PROJECT",
      description: `User ${userId} has left the project ${projectIdNumber}`,
    });

    logger.info("project.leave_collab.success", { userId, projectId: projectIdNumber });

    return NextResponse.json({
        success: true,
        message: "You have successfully left the project.",
      }, { status: 200 }
    );
  } catch (error) {
    logger.error("project.leave_collab.error", { error: String(error), userId, projectId: projectIdNumber });
    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    );
  }
}
