import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { updateProfileSchema } from "@/validations/profileSchemas/updateProfileSchema";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function PUT(req: Request){
    const session = await getServerSession(authOptions);

    if(!session || !session.user || !session.user.id){
        logger.warn("profile.update_my_profile.unauthorized");
        return NextResponse.json({
            success: false,
            message: "Unauthorized"
        },{status: 401})
    }

    const body = await req.json();
    const parsedData = updateProfileSchema.safeParse(body);
    if(!parsedData.success){
        logger.warn("profile.update_my_profile.validation_failed", {
            errors: parsedData.error.flatten().fieldErrors
        });
        return NextResponse.json({
            success: false,
            message: "Invalid data",
            errors: parsedData.error.flatten().fieldErrors
        },{status: 400})
    }
    const { name, bio, githubUrl, linkedinUrl, websiteUrl } = parsedData.data;

    try{
        const userId = parseInt(session.user.id);
        logger.info("profile.update_my_profile.request_received", { userId });

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { name, bio, githubUrl, linkedinUrl, websiteUrl },
          });

        if(!updatedUser){
            logger.warn("profile.update_my_profile.user_not_found", { userId });
            return NextResponse.json({
                success: false,
                message: "User not found"
            },{status: 404})
        }

        logger.info("profile.update_my_profile.success", { userId });

        return NextResponse.json({
            success: true,
            message: "Profile updated successfully",
        },{status: 200})

    }catch(error){
        logger.error("profile.update_my_profile.error", { error: String(error) });
        return NextResponse.json({
            success: false,
            message: "Internal Server Error"
        },{status: 500})
    }
    
}