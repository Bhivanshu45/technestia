import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import { AccessLevel, CollaborationStatus } from "@prisma/client";
import { updateProjectSchema } from "@/validations/projectSchemas/updateProjectSchema";
import { createActivityAndNotify } from "@/lib/activityNotificationRealtime";
import logger from "@/lib/logger";

export async function PATCH(
  req: Request,
  context : { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user?.id) {
    logger.warn("project.update_general.unauthorized");
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
    logger.warn("project.update_general.invalid_project_id", { projectId });
    return NextResponse.json(
      { success: false, message: "Invalid project ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsedData = updateProjectSchema.safeParse(body);

  if (!parsedData.success) {
    logger.warn("project.update_general.validation_failed", { errors: parsedData.error.errors });
    return NextResponse.json(
      {
        success: false,
        message: "Invalid input fields",
        errors: parsedData.error.errors,
      },
      { status: 400 }
    );
  }

  const { title, description, techStack, tags } = parsedData.data;

  try {
    logger.info("project.update_general.request_received", { userId, projectId: projectIdNumber });
    const project = await prisma.project.findUnique({
      where: { id: projectIdNumber },
      select: {
        id: true,
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
      logger.warn("project.update_general.project_not_found", { userId, projectId: projectIdNumber });
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const isOwner = project.userId === userId;
    const isFullCollaborator = project.collaborations.length > 0;

    if (!isOwner && !isFullCollaborator) {
      logger.warn("project.update_general.forbidden", { userId, projectId: projectIdNumber, ownerId: project.userId });
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    const updated = await prisma.project.update({
      where: { id: projectIdNumber },
      data: {
        title: cleanTitle,
        description: cleanDescription,
        techStack,
        tags,
      },
    });

    await createActivityAndNotify({
      userId,
      projectId: projectIdNumber,
      actionType: "UPDATE_PROJECT",
      description: `Updated project "${cleanTitle}" details`,
      targetId: projectIdNumber,
      targetType: "Project",
    });

    logger.info("project.update_general.success", { userId, projectId: projectIdNumber });

    return NextResponse.json(
      {
        success: true,
        message: "Project updated successfully",
        project: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("project.update_general.error", { error: String(error), userId, projectId: projectIdNumber });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
