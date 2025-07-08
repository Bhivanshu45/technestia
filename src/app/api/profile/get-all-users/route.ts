import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
      },
      orderBy: {
        achievementPoints: "desc",
      },
    });

    return NextResponse.json({ 
        success: true,
        message: "All public profiles fetched successfully",
        users 
    }, { status: 200 });
  } catch (error) {
    console.error("[GET_ALL_PUBLIC_PROFILES_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
