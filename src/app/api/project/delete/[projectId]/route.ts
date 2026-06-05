import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import { createActivityAndNotify } from "@/lib/activityNotificationRealtime";
import logger from "@/lib/logger";

export async function DELETE(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    logger.warn("project.delete.unauthorized");
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = parseInt(session.user.id);
  const projectId = parseInt(params.projectId);

  if (isNaN(projectId)) {
    logger.warn("project.delete.invalid_project_id", { projectId: params.projectId });
    return NextResponse.json(
      { success: false, message: "Invalid project ID" },
      { status: 400 }
    );
  }

  try {
    logger.info("project.delete.request_received", { userId, projectId });
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        userId: true,
      },
    });

    if (!project) {
      logger.warn("project.delete.project_not_found", { userId, projectId });
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    if (project.userId !== userId) {
      logger.warn("project.delete.forbidden", { userId, projectId, ownerId: project.userId });
      return NextResponse.json(
        { success: false, message: "Only project owner can delete" },
        { status: 403 }
      );
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    await createActivityAndNotify(
      {
        userId,
        projectId,
        actionType: "DELETE_PROJECT",
        description: `Deleted project with ID ${projectId}`,
        targetId: projectId,
        targetType: "Project",
      },
      {
        recipientUserIds: [userId],
        projectTitle: project.title,
      },
    );

    logger.info("project.delete.success", { userId, projectId });

    return NextResponse.json(
      {
        success: true,
        message: "Project deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("project.delete.error", { error: String(error), userId, projectId });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
