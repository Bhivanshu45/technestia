import { User } from './project';

// Milestone types
export interface Milestone {
  id: number;
  title: string;
  description: string;
  projectId: number;
  createdById: number;
  completionStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  updateRequest: 'NO_REQUEST' | 'PENDING' | 'APPROVED' | 'REJECTED';
  proofUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  lastUpdatedAt: string;
  createdBy: User;
}

export interface MilestoneFormData {
  title: string;
  description: string;
  isPublic: boolean;
}
