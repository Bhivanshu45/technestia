import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import { deleteFromCloudinary } from "@/utils/deleteFromCloudinary";

export async function PUT(req: Request,context: { params: { chatroomId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const {chatroomId} = await context.params;
  const chatroomIdNumber = Number(chatroomId);
  if(!chatroomIdNumber || isNaN(chatroomIdNumber)){
    return NextResponse.json({
        success: false,
        message: "Invalid chat id"
    },{status: 400}) 
  }

  const userId = Number(session.user.id);

  try {
    const chatroom = await prisma.chatRoom.findUnique({
      where: { id: chatroomIdNumber },
      include: {
        participants: {
          where: { hasLeft: false },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
          },
        },
      },
    });

    if(!chatroom) {
      return NextResponse.json(
        { success: false, message: "Chatroom not found" },
        { status: 404 }
      );
    }

    // check if user is admin of this chatroom or not
    const currentParticipant = chatroom.participants.find(
      (p) => p.user.id === userId && p.isAdmin === true
    );

    if (!currentParticipant) {
      return NextResponse.json(
        { success: false, message: "You are not authorized to update this chatroom profile" },
        { status: 403 }
      );
    }
    
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

    if (chatroom.imagePublicId) {
      await deleteFromCloudinary(chatroom.imagePublicId);
    }

    await prisma.chatRoom.update({
      where: { id: chatroomIdNumber },
      data: { 
        image: uploadedImage.secureUrl,
        imagePublicId: uploadedImage.publicId,
     },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Group dp updated successfully",
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
