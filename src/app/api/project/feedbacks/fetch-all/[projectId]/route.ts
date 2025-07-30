import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const { projectId } = await context.params;
  const decodedProjectId = decodeURIComponent(projectId);
  const projectIdNumber = Number(decodedProjectId);
  if (!projectIdNumber || isNaN(projectIdNumber)) {
    return NextResponse.json(
      { success: false, message: "Invalid project ID" },
      { status: 400 }
    );
  }

  const userId = Number(session.user.id);
  if (isNaN(userId)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid user ID",
      },
      { status: 400 }
    );
  }

  try {
    // anyone can create feedback for a project
    const project = await prisma.project.findUnique({
      where: { id: projectIdNumber },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { projectId: projectIdNumber },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Feedbacks fecthed successfully",
        feedbacks,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error in fetching feedback" },
      { status: 500 }
    );
  }
}
