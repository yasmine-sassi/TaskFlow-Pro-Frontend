import { User } from './user.model';

/**
 * Activity model based on NestJS backend Prisma schema
 * Backend stores: id, action, entity, entityId, metadata, userId, projectId, taskId, createdAt
 */
export interface Activity {
  id: string;
  action: string; // e.g., "TASK_CREATED", "COMMENT_ADDED"
  entity: string; // e.g., "TASK", "COMMENT", "PROJECT"
  entityId: string; // ID of the entity that was acted upon
  metadata?: Record<string, any>; // Additional data
  userId?: string;
  projectId?: string;
  taskId?: string;
  createdAt: Date;

  // Relations (populated on demand)
  user?: User;
}
