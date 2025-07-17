import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CollaborationStatus } from "@prisma/client";
import { checkPermission } from "@/utils/checkPermission";

export async function DELETE(req: Request, context: { params: { projectId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session?.user || !session.user.id) {
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
    return NextResponse.json(
      { success: false, message: "Invalid project ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const targetUserId = Number(body.userId);
    if (isNaN(targetUserId)) {
        return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
        );
    }

    if(userId === targetUserId){
        return NextResponse.json(
            { success: false, message: "You cannot remove yourself from the project." },
            { status: 403 }
        );
    }

  try {
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
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    if (project.userId === targetUserId) {
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
      return NextResponse.json({
          success: false,
          message: "You are not a contributor on this project.",
        },{ status: 403 }
      );
    }

    // check if user has permission to remove collaborator
    const hasPermission = checkPermission({project, userId, targetUserId});
    if (!hasPermission) {
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

    return NextResponse.json(
      {
        success: true,
        message: "Collaborator has been successfully removed from the project.",
      },
      { status: 200 }
    );
  }catch(error){
    console.error("REMOVE API ERROR:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while removing the collaborator." },
      { status: 500 }
    );
  }

  
}