import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CollaborationStatus } from "@prisma/client";

export async function POST(_req: Request, context: {params: {projectId : string}}){
    const session = await getServerSession(authOptions);
    if(!session || !session.user || !session.user.id){
        return NextResponse.json({
            success: false,
            message: "Unauthorized"
        },{status: 401})
    }

    const userId = Number(session.user.id);
    const { projectId } = await context.params;
    const decodedProjectId = decodeURIComponent(projectId);
    const projectIdNumber = Number(decodedProjectId);

    if (!projectIdNumber || isNaN(Number(projectIdNumber))) {
      return NextResponse.json(
        { success: false, message: "Invalid project ID" },
        { status: 400 }
      );
    }

    try{
        const project = await prisma.project.findUnique({
          where: { id: projectIdNumber },
          select: {
            id: true,
            userId: true,
            isPublic: true,
          },
        });

        if (!project) {
          return NextResponse.json(
            { success: false, message: "Project not found" },
            { status: 404 }
          );
        }

        if (project.userId === userId) {
          return NextResponse.json(
            { success: false, message: "Owner cannot request collaboration" },
            { status: 400 }
          );
        }

        const collabExist = await prisma.collaboration.findFirst({
          where: {
            projectId: projectIdNumber,
            userId,
            status: { in: [CollaborationStatus.PENDING, CollaborationStatus.ACCEPTED] },
            invitedBy: null, // make sure user is not already invited by someone
          },
        });

        if(collabExist){
            return NextResponse.json({
                success: false,
                message: `You are already ${collabExist.invitedBy ? "invited to join" : collabExist.status === "PENDING" ? "requested to join" : "a collaborator of" } this project.`,
              },
              { status: 409 }
            );
        }

        const createdCollab = await prisma.collaboration.create({
          data: {
            projectId: projectIdNumber,
            userId,
            status: "PENDING",
            accessLevel: "LIMITED",
            invitedBy: null,
          },
        });

        await prisma.activityLog.create({
          data: {
            userId,
            projectId: projectIdNumber,
            actionType: "REQUEST_COLLABORATION",
            description: `Requested to join project ID ${projectId}`,
            targetId: createdCollab.id,
            targetType: "Collaboration",
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: "Collaboration request sent successfully",
          },
          { status: 200 }
        );

    }catch(error){
        console.error("Request Collab Error:", error);
        return NextResponse.json(
          { success: false, message: "Internal Server Error" },
          { status: 500 }
        );
    }
}