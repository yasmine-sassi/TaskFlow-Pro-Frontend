import { User } from './user.model';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  position: number;
  projectId: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  owner?: User;
  assignees?: User[];
  subtasks?: Subtask[];
  comments?: Comment[];
  attachments?: Attachment[];
  labels?: Label[];
}

export interface Subtask {
  id: string;
  title: string;
  isComplete: boolean;
  position: number;
  taskId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  taskId: string;
  createdAt: Date;
  updatedAt: Date;
}
