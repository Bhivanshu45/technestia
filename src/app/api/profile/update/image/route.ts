import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import logger from "@/lib/logger";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    logger.warn("profile.update_image.unauthorized");
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    logger.info("profile.update_image.request_received", { userId: session.user.id });
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      logger.warn("profile.update_image.file_missing", { userId: session.user.id });
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      logger.warn("profile.update_image.file_too_large", { userId: session.user.id, size: file.size });
      return NextResponse.json(
        {
          success: false,
          message: "File size exceeds 5MB limit",
        },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      logger.warn("profile.update_image.invalid_type", { userId: session.user.id, type: file.type });
      return NextResponse.json(
        {
          success: false,
          message: "Only images are allowed",
        },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      logger.warn("profile.update_image.unsupported_type", { userId: session.user.id, type: file.type });
      return NextResponse.json(
        { success: false, message: "File type not supported" },
        { status: 400 }
      );
    }
      

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    logger.info("profile.update_image.upload_started", { userId: session.user.id, type: file.type, size: file.size });
    const uploadedImage = await uploadToCloudinary(buffer);

    const userId = parseInt(session.user.id);

    await prisma.user.update({
      where: { id: userId },
      data: { 
        image: uploadedImage.secureUrl,
        imagePublicId: uploadedImage.publicId,
     },
    });

    logger.info("profile.update_image.success", { userId });

    return NextResponse.json(
      {
        success: true,
        message: "Profile image updated successfully",
        imageUrl: uploadedImage.secureUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("profile.update_image.error", { error: String(error) });
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
