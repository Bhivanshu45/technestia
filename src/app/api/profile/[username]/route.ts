import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params{
    params : {username : string}
}

export async function GET(_req: Request,{params}: Params){
    const { username } = params;

    const decodedUsername = decodeURIComponent(username || "");

    if(!decodedUsername){
        return NextResponse.json({
            success:false,
            message: "Username is Required"
        },{status: 400})
    }

    try{
        const user = await prisma.user.findUnique({
          where: { username: decodedUsername },
          select: {
            id: true,
            username: true,
            name: true,
            bio: true,
            image: true,
            githubUrl: true,
            linkedinUrl: true,
            websiteUrl: true,
          },
        });
        if(!user){
            return NextResponse.json({
                success: false,
                message: "User not found"
            },{status: 404})
        }

        return NextResponse.json({
            success: true,
            message: "User details fetched successfully",
            user
        },{status: 200})

    }catch(error){
        console.error("[GET_PROFILE_ERROR]", error);
        return NextResponse.json(
          { success: false, message: "Internal Server Error" },
          { status: 500 }
        );
    }
}