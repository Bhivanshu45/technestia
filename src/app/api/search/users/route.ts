import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim();

    const filters: any = {
      isVerified: true,
    };

    if (query) {
      filters.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
        { bio: { contains: query, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where: filters,
      orderBy: {
        achievementPoints: "desc",
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        achievementPoints: true,
      },
      take: 12,
    });

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users found matching your query",
        data: [],
      },{status: 200});
    }

    return NextResponse.json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("SEARCH USERS API ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
