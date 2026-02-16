import { User } from "./project";

export interface CollaboratorEntry {
  id: number;
  createdAt?: string;
  status?: "PENDING" | "ACCEPTED" | "REJECTED";
  accessLevel?: "LIMITED" | "FULL";
  invitedBy?: number | null;
  user: User;
  inviter?: User | null;
}

export interface CollaborationInvite {
  id: number;
  createdAt: string;
  accessLevel: "LIMITED" | "FULL";
  project: {
    id: number;
    title: string;
    description: string;
    status: string;
    techStack: string[];
    tags: string[];
    screenshots: string[];
    uploadedAt: string;
  };
  inviter: User | null;
}

export interface CollaborationRequest {
  id: number;
  createdAt: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  accessLevel: "LIMITED" | "FULL";
  project: {
    id: number;
    title: string;
    description: string;
    status: string;
    techStack: string[];
    tags: string[];
    screenshots: string[];
    uploadedAt: string;
  };
}
