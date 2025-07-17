import { AccessLevel, CollaborationStatus } from "@prisma/client";

export const checkPermission = ({project, userId, targetUserId} : {project: any, userId: number, targetUserId: number}) => {
    if(project.userId === userId){
        return true;
    }

    // check remover has full access
    const removerCollab = project.collaborations.find((collab : any) => {
        return collab.userId === userId && 
               collab.status === CollaborationStatus.ACCEPTED &&
               collab.accessLevel === AccessLevel.FULL;
    });

    if(!removerCollab){ // if remover has not full access 
        return false;
    }

    // check target user has full access
    const targetCollab = project.collaborations.find((collab : any) => {
        return collab.userId === targetUserId && 
               collab.status === CollaborationStatus.ACCEPTED &&
               collab.accessLevel === AccessLevel.FULL;
    });

    if(targetCollab){
        return false;
    }

    return true;
}