import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import { createProjectSchema } from "@/validations/projectSchemas/createProjectSchema";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = Number(session.user.id);

  if (isNaN(userId)) {
    return NextResponse.json(
      { success: false, message: "Invalid user id" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid project data",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const {
    title,
    description,
    techStack,
    tags = [],
    status,
    isPublic = false,
    githubUrl,
    liveDemoUrl,
    screenshots = [],
  } = parsed.data;

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 403 }
      );
    }
    if (!dbUser.isVerified) {
      return NextResponse.json(
        { success: false, message: "User not verified" },
        { status: 403 }
      );
    }

      const existing = await prisma.project.findFirst({
        where: { title, userId },
      });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Project with same title exists" },
        { status: 409 }
      );
    }

    const uploadedScreenshots = await Promise.all(
      screenshots.map(async (file) => {
        const buffer = Buffer.from(file.buffer, "base64");
        const type = file.type.startsWith("video") ? "video" : "image";
        const { secureUrl } = await uploadToCloudinary(buffer,type);
        return secureUrl;
      })
    );
    

    const newProject = await prisma.project.create({
      data: {
        title,
        description,
        techStack,
        tags,
        status,
        isPublic,
        githubUrl: githubUrl || null,
        liveDemoUrl: liveDemoUrl || null,
        screenshots: uploadedScreenshots,
        userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        techStack: true,
        tags: true,
        status: true,
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
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        projectId: newProject.id,
        actionType: "POST_PROJECT",
        description: `Created new project \"${newProject.title}\"`,
        targetId: newProject.id,
        targetType: "Project",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully",
        project: newProject,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create Project Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
