import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CollaborationStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
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

  const body = await req.json();
  const targetCollabId = Number(body.targetCollabId);

  if (isNaN(targetCollabId)) {
    return NextResponse.json(
      { success: false, message: "Invalid collaboration ID" },
      { status: 400 }
    );
  }

  try {
    const invite = await prisma.collaboration.findFirst({
      where: {
        id: targetCollabId,
        projectId: projectIdNumber,
        invitedBy: userId,
        status: CollaborationStatus.PENDING,
      },
    });

    if (!invite) {
      return NextResponse.json(
        { success: false, message: "No pending invite found" },
        { status: 404 }
      );
    }

    await prisma.collaboration.update({
      where: { id: invite.id },
      data: {
        status: CollaborationStatus.REJECTED,
        lastUpdatedAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        projectId: projectIdNumber,
        actionType: "REJECT_COLLABORATION",
        description: `Canceled invite for user ID ${invite.userId}`,
        targetId: invite.id,
        targetType: "Collaboration",
      },
    });

    return NextResponse.json(
      { success: true, message: "Invite canceled successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CANCEL_INVITE_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
