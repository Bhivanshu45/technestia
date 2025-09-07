import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim();
    const techRaw = searchParams.get("tech");
    const tech = techRaw
      ? techRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;
    const tagRaw = searchParams.get("tag");
    const tag = tagRaw
      ? tagRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;
    const status = searchParams.get("status")?.toUpperCase();

    const filters: any = {
      AND: [{ isPublic: true }],
    };

    if (query) {
      filters.AND.push({
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { tags: { hasSome: [query] } },
          { techStack: { hasSome: [query] } },
        ],
      });
    }
    if (tech && tech.length > 0) {
      filters.AND.push({ techStack: { hasSome: tech } });
    }
    if (tag && tag.length > 0) {
      filters.AND.push({ tags: { hasSome: tag } });
    }
    if (status) {
      filters.AND.push({ status });
    }

    // Fetch more projects to allow for effective JS-side partial/case-insensitive search
    const projects = await prisma.project.findMany({
      where: filters,
      orderBy: { lastUpdatedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        techStack: true,
        tags: true,
        status: true,
        screenshots: true,
        githubUrl: true,
        liveDemoUrl: true,
        uploadedAt: true,
      },
      take: 200, // increase if your dataset is small; decrease if performance is an issue
    });

    let filteredProjects = projects;
    if (query) {
      const q = query.toLowerCase();
      filteredProjects = projects.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.tags && p.tags.some((tag) => tag.toLowerCase().includes(q))) ||
          (p.techStack &&
            p.techStack.some((tech) => tech.toLowerCase().includes(q)))
      );
    }

    return NextResponse.json({
      success: true,
      message: "Projects fetched successfully",
      data: filteredProjects,
    });
  } catch (error) {
    console.error("SEARCH PROJECTS API ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
