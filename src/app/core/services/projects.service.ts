import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Project, ProjectMember, ProjectMemberRole } from '../models/project.model';
import { BaseService } from './base.service';

export interface CreateProjectDto {
  name: string;
  description?: string;
  color?: string;
  isArchived?: boolean;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  color?: string;
  isArchived?: boolean;
}

export interface AddMemberDto {
  userId: string;
  role: ProjectMemberRole;
}

export interface UpdateMemberDto {
  role: ProjectMemberRole;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectsService extends BaseService {
  /**
   * Create a new project
   */
  createProject(dto: CreateProjectDto): Observable<Project> {
    return this.http.post<Project>(this.buildUrl('/projects'), dto);
  }

  /**
   * Get all projects accessible to current user
   */
  getAllProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.buildUrl('/projects'));
  }

  /**
   * Get a single project by ID
   */
  getProjectById(projectId: string): Observable<Project> {
    return this.http.get<Project>(this.buildUrl(`/projects/${projectId}`));
  }

  /**
   * Update a project (owner only)
   */
  updateProject(projectId: string, dto: UpdateProjectDto): Observable<Project> {
    return this.http.patch<Project>(this.buildUrl(`/projects/${projectId}`), dto);
  }

  /**
   * Delete a project (owner only)
   */
  deleteProject(projectId: string): Observable<void> {
    return this.http.delete<void>(this.buildUrl(`/projects/${projectId}`));
  }

  /**
   * Archive/Unarchive a project
   */
  toggleArchive(projectId: string, isArchived: boolean): Observable<Project> {
    return this.http.patch<Project>(this.buildUrl(`/projects/${projectId}`), { isArchived });
  }

  // ============================================
  // Project Members Management
  // ============================================

  /**
   * Get all members of a project
   */
  getProjectMembers(projectId: string): Observable<ProjectMember[]> {
    return this.http.get<ProjectMember[]>(this.buildUrl(`/projects/${projectId}/members`));
  }

  /**
   * Add a member to the project (owner only)
   */
  addMember(projectId: string, dto: AddMemberDto): Observable<ProjectMember> {
    return this.http.post<ProjectMember>(this.buildUrl(`/projects/${projectId}/members`), dto);
  }

  /**
   * Update member role (owner only)
   */
  updateMemberRole(
    projectId: string,
    memberId: string,
    dto: UpdateMemberDto
  ): Observable<ProjectMember> {
    return this.http.patch<ProjectMember>(
      this.buildUrl(`/projects/${projectId}/members/${memberId}`),
      dto
    );
  }

  /**
   * Remove a member from the project (owner only)
   */
  removeMember(projectId: string, memberId: string): Observable<void> {
    return this.http.delete<void>(this.buildUrl(`/projects/${projectId}/members/${memberId}`));
  }

  /**
   * Check if current user is project owner
   */
  isProjectOwner(project: Project, currentUserId: string): boolean {
    return project.ownerId === currentUserId;
  }

  /**
   * Check if current user has edit permissions
   */
  canEdit(project: Project, currentUserId: string): boolean {
    if (this.isProjectOwner(project, currentUserId)) {
      return true;
    }

    const member = project.members?.find((m) => m.userId === currentUserId);
    return member?.role === ProjectMemberRole.EDITOR;
  }

  /**
   * Check if current user is a member of the project
   */
  isMember(project: Project, currentUserId: string): boolean {
    if (this.isProjectOwner(project, currentUserId)) {
      return true;
    }
    return project.members?.some((m) => m.userId === currentUserId) ?? false;
  }
}
