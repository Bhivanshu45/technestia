import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary } from "@/utils/deleteFromCloudinary";
import logger from "@/lib/logger";

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    logger.warn("profile.remove_account.unauthorized");
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const userId = parseInt(session.user.id);
    logger.info("profile.remove_account.request_received", { userId });

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { imagePublicId: true },
    });

    if (!dbUser) {
      logger.warn("profile.remove_account.user_not_found", { userId });
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (dbUser.imagePublicId) {
      logger.info("profile.remove_account.cloudinary_delete_started", { userId });
      await deleteFromCloudinary(dbUser.imagePublicId);
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info("profile.remove_account.success", { userId });

    return NextResponse.json(
      { success: true, message: "Account deleted successfully" },
      { status: 200 }
    );
    
  } catch (error) {
    logger.error("profile.remove_account.error", { error: String(error) });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
