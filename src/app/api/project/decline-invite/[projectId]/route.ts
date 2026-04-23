import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CollaborationStatus } from "@prisma/client";
import { emitCollabSyncToUsers } from "@/lib/collabRealtime";
import { createActivityAndNotify } from "@/lib/activityNotificationRealtime";

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
        { success: false, message: "No pending invite found" },
        { status: 404 }
      );
    }

    const updatedCollab = await prisma.collaboration.update({
      where: { id: invite.id },
      data: {
        status: CollaborationStatus.REJECTED,
        lastUpdatedAt: new Date(),
      },
    });

    await createActivityAndNotify({
      userId,
      projectId: projectIdNumber,
      actionType: "REJECT_COLLABORATION",
      description: `Declined invite for project ID ${projectIdNumber}`,
      targetId: invite.id,
      targetType: "Collaboration",
    }, {
      recipientUserIds: [Number(invite.invitedBy)],
    });

    emitCollabSyncToUsers([userId, Number(invite.invitedBy)], {
      type: "INVITE_DECLINED",
      projectId: projectIdNumber,
      collaborationId: invite.id,
      status: "REJECTED",
      actorUserId: userId,
      targetUserId: userId,
      invitedBy: invite.invitedBy,
      updatedAt: updatedCollab.lastUpdatedAt.toISOString(),
    });

    return NextResponse.json(
      { success: true, message: "Invite declined successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DECLINE_INVITE_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
