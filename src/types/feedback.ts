import { User } from './project';

// Feedback types
export interface FeedbackReaction {
  id: number;
  type: 'LIKE' | 'LOVE' | 'LAUGH' | 'WOW' | 'SAD' | 'ANGRY';
  userId: number;
  feedbackId: number;
  createdAt: string;
}

export interface Feedback {
  id: number;
  content: string;
  rating: number | null;
  projectId: number;
  createdById: number;
  createdAt: string;
  lastUpdatedAt: string;
  createdBy: User;
  reactions: FeedbackReaction[];
}

export interface FeedbackFormData {
  content: string;
  rating?: number;
}
