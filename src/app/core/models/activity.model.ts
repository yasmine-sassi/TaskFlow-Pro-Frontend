export enum ActivityType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DELETED = 'TASK_DELETED',
  TASK_MOVED = 'TASK_MOVED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  USER_ASSIGNED = 'USER_ASSIGNED',
}

export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  taskId?: string;
  taskTitle?: string;
  details: string;
  timestamp: Date;
}
