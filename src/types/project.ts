// Project types
export interface Project {
  id: number;
  title: string;
  description: string;
  techStack: string[];
  tags: string[];
  status: 'IDEA' | 'IN_PROGRESS' | 'COMPLETED';
  isPublic: boolean;
  githubUrl: string | null;
  liveDemoUrl: string | null;
  screenshots: string[];
  uploadedAt: string;
  lastUpdatedAt: string;
  userId: number;
}

export interface User {
  id: number;
  name: string;
  username: string;
  image: string | null;
}

export interface ProjectWithRelations extends Project {
  user: User;
  collaborators: User[];
  accessLevel?: 'LIMITED' | 'FULL' | null;
}

export interface ProjectFormData {
  title: string;
  description: string;
  techStack: string[];
  tags: string[];
  status: 'IDEA' | 'IN_PROGRESS' | 'COMPLETED';
  isPublic: boolean;
  githubUrl: string;
  liveDemoUrl: string;
  screenshots: Array<{
    name: string;
    type: string;
    buffer: string;
  }>;
}
