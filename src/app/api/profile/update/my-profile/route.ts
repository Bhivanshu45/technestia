import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { updateProfileSchema } from "@/validations/profileSchemas/updateProfileSchema";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request){
    const session = await getServerSession(authOptions);

    if(!session || !session.user || !session.user.id){
        return NextResponse.json({
            success: false,
            message: "Unauthorized"
        },{status: 401})
    }

    const body = await req.json();
    const parsedData = updateProfileSchema.safeParse(body);
    if(!parsedData.success){
        return NextResponse.json({
            success: false,
            message: "Invalid data",
            errors: parsedData.error.flatten().fieldErrors
        },{status: 400})
    }
    const { name, bio, githubUrl, linkedinUrl, websiteUrl } = parsedData.data;

    try{
        const userId = parseInt(session.user.id);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { name, bio, githubUrl, linkedinUrl, websiteUrl },
          });

        if(!updatedUser){
            return NextResponse.json({
                success: false,
                message: "User not found"
            },{status: 404})
        }

        return NextResponse.json({
            success: true,
            message: "Profile updated successfully",
        },{status: 200})

    }catch(error){
        console.error("[UPDATE_PROFILE_ERROR]", error);
        return NextResponse.json({
            success: false,
            message: "Internal Server Error"
        },{status: 500})
    }
    
}