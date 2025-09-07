import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = parseInt(session.user.id);
  const projectId = parseInt(params.projectId);

  if (isNaN(projectId)) {
    return NextResponse.json(
      { success: false, message: "Invalid project ID" },
      { status: 400 }
    );
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        userId: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    if (project.userId !== userId) {
      return NextResponse.json(
        { success: false, message: "Only project owner can delete" },
        { status: 403 }
      );
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        projectId,
        actionType: "DELETE_PROJECT",
        description: `Deleted project with ID ${projectId}`,
        targetId: projectId,
        targetType: "Project",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Project deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Project Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
