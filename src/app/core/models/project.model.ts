// src/app/core/models/project.model.ts
import { User } from './user.model';
import { Task } from './task.model';

export enum ProjectMemberRole {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isArchived: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  owner?: User;
  members?: ProjectMember[];
  tasks?: Task[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  user?: User;
  project?: Project;
}
