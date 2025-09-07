import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim();

    const techRaw = searchParams.get("tech");
    const tech = techRaw
      ? techRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : undefined;

    const tagRaw = searchParams.get("tag");
    const tag = tagRaw
      ? tagRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : undefined;

    const status = searchParams.get("status")?.toUpperCase();
    const completionStatus = searchParams.get("completionStatus")?.toUpperCase();

    const filters: any = {
      isPublic: true,
      project: {
        isPublic: true,
      },
    };

    if (query) {
      filters.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    if (tech && tech.length > 0) {
      filters.project = {
        ...filters.project,
        techStack: { hasSome: tech },
      };
    }

    if (tag && tag.length > 0) {
      filters.project = {
        ...filters.project,
        tags: { hasSome: tag },
      };
    }

    if (status) {
      filters.status = status;
    }

    if (completionStatus) {
      filters.completionStatus = completionStatus;
    }

    const milestones = await prisma.milestone.findMany({
      where: filters,
      orderBy: { lastUpdatedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        completionStatus: true,
        proofUrl: true,
        createdAt: true,
        project: {
          select: {
            id: true,
            title: true,
            techStack: true,
            tags: true,
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
      take: 12,
    });

    return NextResponse.json({
      success: true,
      message: "Milestones fetched successfully",
      data: milestones,
    });
  } catch (error) {
    console.error("SEARCH MILESTONES API ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
