import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CollaborationStatus } from "@prisma/client";

export async function PATCH(
  _req: Request,
  context: { params: { projectId: string } }
) {
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

  try {
    const invite = await prisma.collaboration.findFirst({
      where: {
        projectId: projectIdNumber,
        userId,
        status: CollaborationStatus.PENDING,
        invitedBy: { not: null },
      },
    });

    if (!invite) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid invitation found",
        },
        { status: 404 }
      );
    }

    const updatedCollab = await prisma.collaboration.update({
      where: { id: invite.id },
      data: {
        status: CollaborationStatus.ACCEPTED,
        lastUpdatedAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        projectId: projectIdNumber,
        actionType: "APPROVE_COLLABORATION",
        description: `Accepted invite to collaborate on project ID ${projectId}`,
        targetId: updatedCollab.id,
        targetType: "Collaboration",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Successfully joined project",
        collaboration: updatedCollab,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Join Invite Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
