import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CollaborationStatus } from "@prisma/client";

export async function GET(_req: Request, context: { params: { projectId: string } }){
    const session = await getServerSession(authOptions);

    if(!session || !session.user || !session.user.id){
        return NextResponse.json({
            success: false,
            message: "Unauthorized"
        },{status : 401});
    }

    const { projectId } = await context.params;
    const decodedProjectId = decodeURIComponent(projectId);
    const projectIdNumber = Number(decodedProjectId);

    if (!projectIdNumber || isNaN(Number(projectIdNumber))) {
      return NextResponse.json(
        { success: false, message: "Invalid project ID" },
        { status: 400 }
      );
    }

    const userId = Number(session.user.id);
    if(isNaN(userId)){
        return NextResponse.json({
            success: false,
            message: "Invalid user ID"
        },{status : 400});
    }

    try{
        const project = await prisma.project.findUnique({
          where: { id: projectIdNumber },
          include: {
            collaborations: {
              where: { userId, status: CollaborationStatus.ACCEPTED },
              select: { id: true },
            },
          },
        });

        if(!project){
            return NextResponse.json({
                success: false,
                message: "Project not found"
            },{status : 404});
        }

        const isOwner = project.userId === userId;
        const isCollaborator = project.collaborations.length > 0; 

        // get milestones based on public user or collaborator
        const milestones = await prisma.milestone.findMany({
          where: {
            projectId: projectIdNumber,
            ...(isOwner || isCollaborator ? {} : { isPublic: true }), // apply filter for public user
          },
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, username: true, image: true },
            },
          },
        });

        return NextResponse.json({
            success: true,
            message: "Milestones fetched successfully",
            milestones
        },{status : 200});
        
    }catch(error){
        console.error("Error fetching milestones:", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error"
        },{status : 500});
    }

}