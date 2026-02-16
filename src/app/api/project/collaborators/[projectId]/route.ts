import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CollaborationStatus } from "@prisma/client";

export async function GET(
  _req: Request,
  context: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
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

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectIdNumber },
      select: { id: true, userId: true },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const isOwner = project.userId === userId;

    const isCollaborator = await prisma.collaboration.findFirst({
      where: {
        projectId: projectIdNumber,
        userId,
        status: "ACCEPTED",
      },
      select: {
        accessLevel: true,
      },
    });

    const hasFullAccess = isOwner || isCollaborator?.accessLevel === "FULL";

    // get collaborators based on accessLevel
    const collaborations = await prisma.collaboration.findMany({
      where: {
        projectId: projectIdNumber,
        ...(hasFullAccess ? {} : { status : CollaborationStatus.ACCEPTED })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // transform collaborators data
    const collaborators = collaborations.map((collab) => ({
      id: collab.id,
      createdAt: collab.createdAt,
      ...(hasFullAccess && {
        accessLevel: collab.accessLevel,
        status: collab.status,
        invitedBy: collab.invitedBy,
      }),
      user: collab.user,
      inviter: collab.inviter || null,
    }));

    return NextResponse.json({
        success: true,
        message: "Collaborators fetched successfully",
        collaborators,
    },{ status: 200 });

  } catch (error) {
    console.error("Error fetching collaborators:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
