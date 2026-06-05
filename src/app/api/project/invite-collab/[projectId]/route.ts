import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccessLevel, CollaborationStatus } from "@prisma/client";
import { emitCollabSyncToUsers } from "@/lib/collabRealtime";
import { createActivityAndNotify } from "@/lib/activityNotificationRealtime";
import { checkRateLimit } from "@/lib/rateLimit";
import logger from "@/lib/logger";

export async function POST(req: Request, context: { params: { projectId: string } }) {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
    logger.warn("project.invite_collab.unauthorized");
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
      logger.warn("project.invite_collab.invalid_project_id", { projectId });
      return NextResponse.json(
        { success: false, message: "Invalid project ID" },
        { status: 400 }
      );
    }

    // check rate limiting
    const key = `invite-collab:user:${userId}:project:${projectIdNumber}`;
    const rateLimitRes = await checkRateLimit(key);
    if (!rateLimitRes.success) {
      logger.warn("project.invite_collab.rate_limited", { userId, projectId: projectIdNumber });
        return NextResponse.json(
        {
            success: false,
            message: "Too many requests. Please try again later.",
        },
        { status: 429 }
        );
    }

    
    const body = await req.json();
    const giveAccess = body.giveAccess;
    if (!giveAccess || (giveAccess !== "FULL" && giveAccess !== "LIMITED")) {
      logger.warn("project.invite_collab.invalid_access_level", { userId, projectId: projectIdNumber, giveAccess });
      return NextResponse.json({
        success: false,
        message: "Invalid access level"
      });
    }
    const targetUserId = Number(body.userId);

    if (isNaN(targetUserId)) {
      logger.warn("project.invite_collab.invalid_target_user", { userId, projectId: projectIdNumber, targetUserId: body.userId });
        return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
        );
    }

    if (userId === targetUserId) {
    logger.warn("project.invite_collab.self_invite_blocked", { userId, projectId: projectIdNumber });
        return NextResponse.json(
            { success: false, message: "You cannot invite yourself to the project." },
            { status: 403 }
        );
    }
    
    try {
      logger.info("project.invite_collab.request_received", { userId, projectId: projectIdNumber, targetUserId, giveAccess });
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
      logger.warn("project.invite_collab.project_not_found", { userId, projectId: projectIdNumber });
        return NextResponse.json(
            { success: false, message: "Project not found" },
            { status: 404 }
        );
        }

        if(project.userId == targetUserId){
      logger.warn("project.invite_collab.owner_invite_blocked", { userId, projectId: projectIdNumber, targetUserId });
            return NextResponse.json(
                { success: false, message: "Project owner cannot be invited" },
                { status: 403 }
            );
        }
    
        const isOwner = userId === project.userId;
        const isFullAccessCollab = project.collaborations.length > 0;
    
        if (!isOwner && !isFullAccessCollab) {
      logger.warn("project.invite_collab.forbidden", { userId, projectId: projectIdNumber, targetUserId });
        return NextResponse.json(
            { success: false, message: "Forbidden: Access Denied" },
            { status: 403 }
        );
        }


        const existingCollab = await prisma.collaboration.findFirst({
            where: {
                projectId: projectIdNumber,
                userId: targetUserId,
                status: { in: [CollaborationStatus.PENDING, CollaborationStatus.ACCEPTED] },
            },
        });

        if (existingCollab) {
          logger.warn("project.invite_collab.already_exists", { userId, projectId: projectIdNumber, targetUserId, status: existingCollab.status });
          return NextResponse.json(
            {
              success: false,
              message: `User already has a ${existingCollab.status.toLowerCase()} collaboration`,
            },
            { status: 409 }
          );
        }
    
        const createInvite = await prisma.collaboration.create({
            data: {
                projectId: projectIdNumber,
                userId: targetUserId,
                invitedBy: userId,
                status: CollaborationStatus.PENDING,
                accessLevel: giveAccess === "FULL" ? AccessLevel.FULL : AccessLevel.LIMITED,
            }
        })

          logger.info("project.invite_collab.success", { userId, projectId: projectIdNumber, targetUserId, collaborationId: createInvite.id });

        await createActivityAndNotify({
          userId,
          projectId: projectIdNumber,
          actionType: "REQUEST_COLLABORATION",
          description: `Invited user ${targetUserId} to collaborate`,
          targetId: createInvite.id,
          targetType: "Collaboration",
        }, {
          recipientUserIds: [targetUserId],
        });

        emitCollabSyncToUsers([userId, targetUserId], {
          type: "INVITE_SENT",
          projectId: projectIdNumber,
          collaborationId: createInvite.id,
          status: "PENDING",
          actorUserId: userId,
          targetUserId,
          invitedBy: userId,
          updatedAt: createInvite.lastUpdatedAt.toISOString(),
        });
    
        return NextResponse.json(
        { success: true, message: "Collaboration invitation sent", inviteRequest: createInvite },
        { status: 200 }
        );

    } catch (error) {
    logger.error("project.invite_collab.error", { error: String(error), userId, projectId: projectIdNumber });
        return NextResponse.json(
        { success: false, message: "Internal server error" },
        { status: 500 }
        );
    }
}