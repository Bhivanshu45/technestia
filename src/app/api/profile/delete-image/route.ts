import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary } from "@/utils/deleteFromCloudinary";

export async function DELETE(_req: Request){
    const session = await getServerSession(authOptions);

    if(!session || !session.user || !session.user.id){
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
    }

    try{
        const userId = parseInt(session.user.id);
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { image: true, imagePublicId: true },
        });

        if (!dbUser || !dbUser.image || !dbUser.imagePublicId) {
          return NextResponse.json(
            { success: false, message: "No profile image found to delete" },
            { status: 400 }
          );
        }

        await deleteFromCloudinary(dbUser.imagePublicId);

        await prisma.user.update({
          where: { id: userId },
          data: { image: null, imagePublicId: null },
        });
      

        return NextResponse.json(
          { success: true, message: "Profile image deleted successfully" },
          { status: 200 }
        );

    }catch(error){
        console.error("[DELETE_PROFILE_IMAGE_ERROR]", error);
        return NextResponse.json(
          { success: false, message: "Internal Server Error" },
          { status: 500 }
        );
    }

}