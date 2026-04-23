import { prisma } from "@/lib/prisma";
import {
  ActivityType,
  CollaborationStatus,
  NotificationType,
} from "@prisma/client";

interface CreateActivityInput {
  userId: number;
  projectId: number;
  actionType: ActivityType;
  description?: string | null;
  targetId?: number | null;
  targetType?: string | null;
}

interface CreateActivityOptions {
  recipientUserIds?: number[];
  projectTitle?: string;
  notificationType?: NotificationType;
  notificationMessage?: string;
  notificationTargetId?: number | null;
  notificationTargetType?: string | null;
}

const toNotificationType = (actionType: ActivityType): NotificationType => {
  switch (actionType) {
    case "REQUEST_COLLABORATION":
      return NotificationType.COLLABORATION_REQUEST;
    case "APPROVE_COLLABORATION":
      return NotificationType.COLLABORATION_APPROVED;
    case "REJECT_COLLABORATION":
      return NotificationType.GENERAL;
    case "CREATE_FEEDBACK":
      return NotificationType.NEW_FEEDBACK;
    case "REACT_FEEDBACK":
      return NotificationType.FEEDBACK_REACTION;
    default:
      return NotificationType.GENERAL;
  }
};

export async function createActivityAndNotify(
  input: CreateActivityInput,
  options?: CreateActivityOptions,
) {
  const activity = await prisma.activityLog.create({
    data: {
      userId: input.userId,
      projectId: input.projectId,
      actionType: input.actionType,
      description: input.description ?? null,
      targetId: input.targetId ?? null,
      targetType: input.targetType ?? null,
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
    },
  });

  let projectTitle = options?.projectTitle;
  let recipientUserIds = options?.recipientUserIds;

  if (!projectTitle || !recipientUserIds) {
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      select: {
        title: true,
        userId: true,
        collaborations: {
          where: { status: CollaborationStatus.ACCEPTED },
          select: { userId: true },
        },
      },
    });

    if (project) {
      if (!projectTitle) projectTitle = project.title;
      if (!recipientUserIds) {
        recipientUserIds = [
          project.userId,
          ...project.collaborations.map((c) => c.userId),
        ];
      }
    }
  }

  const normalizedRecipients = Array.from(
    new Set(
      (recipientUserIds || [input.userId])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  );

  const io = (globalThis as any).__io;

  const activityPayload = {
    ...activity,
    projectTitle,
  };

  if (io) {
    for (const recipientId of normalizedRecipients) {
      io.to("user:" + recipientId).emit("activity:new", activityPayload);
    }
  }

  const notificationRecipients = normalizedRecipients.filter(
    (id) => id !== input.userId,
  );

  if (notificationRecipients.length > 0) {
    const type = options?.notificationType || toNotificationType(input.actionType);
    const message =
      options?.notificationMessage ||
      input.description ||
      input.actionType.replace(/_/g, " ");
    const targetId =
      options?.notificationTargetId ?? input.targetId ?? input.projectId;
    const targetType = options?.notificationTargetType ?? input.targetType ?? "Project";

    const notifications = await Promise.all(
      notificationRecipients.map((recipientUserId) =>
        prisma.notification.create({
          data: {
            userId: recipientUserId,
            type,
            message,
            targetId,
            targetType,
          },
        }),
      ),
    );

    if (io) {
      notifications.forEach((notification) => {
        io.to("user:" + notification.userId).emit("notification:new", notification);
      });
    }
  }

  return activityPayload;
}
