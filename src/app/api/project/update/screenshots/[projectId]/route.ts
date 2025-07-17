import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import { updateScreenshotsSchema } from "@/validations/projectSchemas/updateProjectSchema";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import { AccessLevel, CollaborationStatus } from "@prisma/client";

export async function PATCH(req: Request, context:{ params: { projectId: string } }) {
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

  console.log("Project ID :", projectIdNumber);

  const body = await req.json();
  const parsed = updateScreenshotsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid screenshots",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  console.log("Parsed Data :", parsed.data);

  const { screenshots } = parsed.data;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectIdNumber },
      select: {
        id: true,
        userId: true,
        collaborations: {
          where: {
            userId,
            status: CollaborationStatus.ACCEPTED,
            accessLevel: AccessLevel.FULL,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    console.log("Project Data :", project);

    const isOwner = project.userId === userId;
    const isFullCollaborator = project.collaborations.length > 0;

    if (!isOwner && !isFullCollaborator) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Access denied" },
        { status: 403 }
      );
    }

    const uploadedScreenshots = await Promise.all(
      screenshots.map(async (file) => {
        const buffer = Buffer.from(file.buffer, "base64");
        const type = file.type.startsWith("video") ? "video" : "image";
        const { secureUrl } = await uploadToCloudinary(buffer, type);
        console.log("Uploaded Screenshot URL:", secureUrl);
        return secureUrl;
      })
    );

    const updated = await prisma.project.update({
      where: { id: projectIdNumber },
      data: {
        screenshots: uploadedScreenshots,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Screenshots updated successfully",
        project: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update screenshots error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
