import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { CollaborationStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(_req: Request) {
    const session = await getServerSession(authOptions);
    if(!session || !session.user || !session.user.id) {
        return NextResponse.json({
            success: false,
            message: "Unauthorized access",
        }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    if (isNaN(userId)) {
      return NextResponse.json({
          success: false,
          message: "Invalid user ID",
        }, { status: 400 });
    }

    try{
        // Fetching user projects
        const projects = await prisma.project.findMany({
          where: { userId },
          orderBy: { uploadedAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            techStack: true,
            tags: true,
            screenshots: true,
            githubUrl: true,
            liveDemoUrl: true,
            uploadedAt: true,
            lastUpdatedAt: true,
          },
        });

        return NextResponse.json({
            success: true,
            message: "User projects fetched successfully",
            projects,
        },{ status: 200 });

    }catch(error){
        console.error("Error fetching user projects:", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error",
        }, { status: 500 });
    }
}