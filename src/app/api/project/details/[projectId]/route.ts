import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import { CollaborationStatus } from "@prisma/client";
import logger from "@/lib/logger";

export async function GET(
  _req: Request,
  context: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    logger.warn("project.details.unauthorized");
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
    logger.warn("project.details.invalid_project_id", { projectId });
    return NextResponse.json(
      { success: false, message: "Invalid project ID" },
      { status: 400 }
    );
  }

  try {
    logger.info("project.details.request_received", { userId, projectId: projectIdNumber });
    const project = await prisma.project.findUnique({
      where: { id: projectIdNumber },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
        collaborations: {
          where: { status: CollaborationStatus.ACCEPTED },
          select: {
            id: true,
            accessLevel: true,
            user: {
              select: { id: true, name: true, username: true, image: true },
            },
          },
        },
      },
    });

    if (!project) {
      logger.warn("project.details.project_not_found", { userId, projectId: projectIdNumber });
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const isOwner = project.userId === userId;

    const isCollaborator = project.collaborations.some(
      (collab) => collab.user.id === userId
    );

    if(!isOwner && !isCollaborator) {
      logger.warn("project.details.forbidden", { userId, projectId: projectIdNumber, ownerId: project.userId });
      return NextResponse.json({
        success: false,
        message: "Forbidden : You are not authorised for this request"
      },{status: 403})
    }

    const collab = project.collaborations.filter((collab) => 
      collab.user.id === userId
    )

    return NextResponse.json(
      {
        success: true,
        project: {
          id: project.id,
          title: project.title,
          description: project.description,
          techStack: project.techStack,
          tags: project.tags,
          screenshots: project.screenshots,
          githubUrl: project.githubUrl,
          liveDemoUrl: project.liveDemoUrl,
          status: project.status,
          isPublic: project.isPublic,
          uploadedAt: project.uploadedAt,
          lastUpdatedAt: project.lastUpdatedAt,
          creator: project.user,
          collaborators: project.collaborations.map((c) => c.user),
          accessLevel: collab.length > 0 ? collab[0].accessLevel : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("project.details.error", { error: String(error), userId, projectId: projectIdNumber });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
