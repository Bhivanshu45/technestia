import { prisma } from "@/lib/prisma";
import { CollaborationStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  context: { params: { projectId: string } }
) {
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
    const project = await prisma.project.findUnique({
      where: { id: projectIdNumber },
      select: {
        id: true,
        title: true,
        description: true,
        techStack: true,
        tags: true,
        status: true,
        isPublic: true,
        githubUrl: true,
        liveDemoUrl: true,
        screenshots: true,
        uploadedAt: true,
        lastUpdatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        collaborations: {
          where: {
            status: CollaborationStatus.ACCEPTED,
          },
          select: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!project || !project.isPublic) {
      return NextResponse.json(
        { success: false, message: "Project not found or not public" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        project: {
          ...project,
          creator: project.user,
          collaborators: project.collaborations.map((c) => c.user),
        },
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error in public project details:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
