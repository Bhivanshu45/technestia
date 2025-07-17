import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session?.user || !session?.user?.id) {
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

    const project = await prisma.project.findUnique({
      where: { id: projectIdNumber },
      select: {
        id: true,
        userId: true,
        collaborations: {
          where: { userId, status: "ACCEPTED" },
          select: { id: true },
        },
      },
    });

    if(!project){
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const isOwner = project.userId === userId;

    const isCollaborator = project.collaborations.length > 0;

    if (!isOwner && !isCollaborator) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Not authorized" },
        { status: 403 }
      );
    }

    const activityLogs = await prisma.activityLog.findMany({
      where: { projectId: projectIdNumber },
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({
        success: true,
        message: "Activity logs fetched successfully",
        activityLogs,
    },{ status: 200 });

  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
