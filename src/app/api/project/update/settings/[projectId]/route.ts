import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import {
  AccessLevel,
  CollaborationStatus,
} from "@prisma/client";
import { settingsSchema } from "@/validations/projectSchemas/settingSchema";
import { createActivityAndNotify } from "@/lib/activityNotificationRealtime";
import logger from "@/lib/logger";

export async function PUT(req: Request, context: { params: { projectId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user?.id) {
    logger.warn("project.update_settings.unauthorized");
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = parseInt(session.user.id);

  const { projectId } = await context.params;
  const decodedProjectId = decodeURIComponent(projectId);
  const projectIdNumber = Number(decodedProjectId);

  if (!projectIdNumber || isNaN(Number(projectIdNumber))) {
    logger.warn("project.update_settings.invalid_project_id", { projectId });
    return NextResponse.json(
      { success: false, message: "Invalid project ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsedData = settingsSchema.safeParse(body);

  if (!parsedData.success) {
    logger.warn("project.update_settings.validation_failed", { errors: parsedData.error.flatten().fieldErrors });
    return NextResponse.json(
      {
        success: false,
        message: "Invalid input fields",
        errors: parsedData.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { status, isPublic } = parsedData.data;

  try {
    logger.info("project.update_settings.request_received", { userId, projectId: projectIdNumber });
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
      logger.warn("project.update_settings.project_not_found", { userId, projectId: projectIdNumber });
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const isOwner = project.userId === userId;
    const isFullCollaborator = project.collaborations.length > 0;

    if (!isOwner && !isFullCollaborator) {
      logger.warn("project.update_settings.forbidden", { userId, projectId: projectIdNumber, ownerId: project.userId });
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const updated = await prisma.project.update({
      where: { id: projectIdNumber },
      data: { status, isPublic },
    });

    await createActivityAndNotify({
      userId,
      projectId: projectIdNumber,
      actionType: "UPDATE_PROJECT",
      description: `Updated project settings (status: ${status}, visibility: ${isPublic ? "public" : "private"})`,
      targetId: projectIdNumber,
      targetType: "Project",
    });

    logger.info("project.update_settings.success", { userId, projectId: projectIdNumber, status, isPublic });

    return NextResponse.json(
      {
        success: true,
        message: "Project settings updated successfully",
        project: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("project.update_settings.error", { error: String(error), userId, projectId: projectIdNumber });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
