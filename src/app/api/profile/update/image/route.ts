import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          message: "File size exceeds 5MB limit",
        },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
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
      return NextResponse.json(
        { success: false, message: "File type not supported" },
        { status: 400 }
      );
    }
      

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadedImage = await uploadToCloudinary(buffer);

    const userId = parseInt(session.user.id);

    await prisma.user.update({
      where: { id: userId },
      data: { 
        image: uploadedImage.secureUrl,
        imagePublicId: uploadedImage.publicId,
     },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Profile image updated successfully",
        imageUrl: uploadedImage.secureUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[UPDATE_PROFILE_IMAGE_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
