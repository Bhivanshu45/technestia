import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AccessLevel, CollaborationStatus } from "@prisma/client";

const linksSchema = z.object({
  githubUrl: z.string().url().nullable().or(z.literal("")),
  liveDemoUrl: z.string().url().nullable().or(z.literal("")),
});

export async function PATCH(req: Request, context: { params: { projectId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
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
    return NextResponse.json(
      { success: false, message: "Invalid project ID" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsedData = linksSchema.safeParse(body);

  if (!parsedData.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid input",
        errors: parsedData.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { githubUrl, liveDemoUrl } = parsedData.data;

  try {
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
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const isOwner = project.userId === userId;
    const isFullCollaborator = project.collaborations.length > 0;

    if (!isOwner && !isFullCollaborator) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const updated = await prisma.project.update({
      where: { id: projectIdNumber },
      data: {
        githubUrl: githubUrl || null,
        liveDemoUrl: liveDemoUrl || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Links updated successfully",
        project: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating links:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
