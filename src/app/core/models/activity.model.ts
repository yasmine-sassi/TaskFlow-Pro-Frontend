import { User } from './user.model';

export interface Activity {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: any;
  userId?: string;
  projectId?: string;
  taskId?: string;
  createdAt: Date;

  // Relations
  user?: User;
}
