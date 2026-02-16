import { User } from './project';

// Activity log types
export type ActivityType =
  | 'CREATE_MILESTONE'
  | 'UPDATE_MILESTONE'
  | 'DELETE_MILESTONE'
  | 'CREATE_FEEDBACK'
  | 'REACT_FEEDBACK'
  | 'REQUEST_COLLABORATION'
  | 'APPROVE_COLLABORATION'
  | 'REJECT_COLLABORATION'
  | 'POST_PROJECT'
  | 'UPDATE_PROJECT'
  | 'DELETE_PROJECT'
  | 'LEAVE_PROJECT'
  | 'REMOVED_FORM_PROJECT';

export interface ActivityLog {
  id: number;
  projectId: number;
  userId: number;
  actionType: ActivityType;
  description: string | null;
  targetId: number | null;
  targetType: string | null;
  createdAt: string;
  user: User;
}
