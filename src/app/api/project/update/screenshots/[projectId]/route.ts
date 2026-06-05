import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import { updateScreenshotsSchema } from "@/validations/projectSchemas/updateProjectSchema";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import { AccessLevel, CollaborationStatus } from "@prisma/client";
import { createActivityAndNotify } from "@/lib/activityNotificationRealtime";
import logger from "@/lib/logger";

export async function PATCH(req: Request, context:{ params: { projectId: string } }) {
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

  logger.info("project.update.screenshots.project_id", { projectIdNumber });

  const body = await req.json();
  const parsed = updateScreenshotsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid screenshots",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  logger.info("project.update.screenshots.parsed_data", { screenshotsCount: parsed.data.screenshots.length });

  const { screenshots } = parsed.data;

  try {
    logger.info("project.update.screenshots.request_received");
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
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    logger.info("project.update.screenshots.project_loaded", { projectIdNumber, ownerId: project.userId });

    const isOwner = project.userId === userId;
    const isFullCollaborator = project.collaborations.length > 0;

    if (!isOwner && !isFullCollaborator) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Access denied" },
        { status: 403 }
      );
    }

    const uploadedScreenshots = await Promise.all(
      screenshots.map(async (file) => {
        const buffer = Buffer.from(file.buffer, "base64");
        const type = file.type.startsWith("video") ? "video" : "image";
        const { secureUrl } = await uploadToCloudinary(buffer, type);
        logger.info("project.update.screenshots.uploaded", { projectIdNumber, type, secureUrl });
        return secureUrl;
      })
    );

    const updated = await prisma.project.update({
      where: { id: projectIdNumber },
      data: {
        screenshots: uploadedScreenshots,
      },
    });

    await createActivityAndNotify({
      userId,
      projectId: projectIdNumber,
      actionType: "UPDATE_PROJECT",
      description: `Updated project screenshots (${uploadedScreenshots.length} files)`,
      targetId: projectIdNumber,
      targetType: "Project",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Screenshots updated successfully",
        project: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Update screenshots error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
