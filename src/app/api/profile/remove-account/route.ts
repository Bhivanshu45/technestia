import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary } from "@/utils/deleteFromCloudinary";

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const userId = parseInt(session.user.id);

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { imagePublicId: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (dbUser.imagePublicId) {
      await deleteFromCloudinary(dbUser.imagePublicId);
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json(
      { success: true, message: "Account deleted successfully" },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("[DELETE_ACCOUNT_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
