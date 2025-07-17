import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request,
  context: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { projectId } = await context.params;
    const decodedProjectId = decodeURIComponent(projectId);
    const projectIdNumber = Number(decodedProjectId);

    if (!projectIdNumber || isNaN(Number(projectIdNumber))) {
      return NextResponse.json(
        { success: false, message: "Invalid project ID" },
        { status: 400 }
      );
    }

    // check if project exist
    const project = await prisma.project.findUnique({
      where: { id: projectIdNumber },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { projectId: projectIdNumber },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
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
        message: "Feedbacks fetched successfully",
        feedbacks,
    },{ status: 200 });

  } catch (error) {
    console.error("Feedbacks API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
