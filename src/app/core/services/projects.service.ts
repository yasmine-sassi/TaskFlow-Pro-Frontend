import { Injectable, inject } from '@angular/core';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { Project, ProjectMember, ProjectMemberRole } from '../models/project.model';
import { BaseService } from './base.service';
import { LoggerService } from './logger.service';

export interface CreateProjectDto {
  name: string;
  description?: string;
  color?: string;
  isArchived?: boolean;
  ownerId: string;
  editors?: string[];
  viewers?: string[];
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  color?: string;
  isArchived?: boolean;
  ownerId?: string;
  editors?: string[];
  viewers?: string[];
}

export interface AddMemberDto {
  userId: string;
  role: ProjectMemberRole;
}

export interface UpdateMemberDto {
  role: ProjectMemberRole;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectsService extends BaseService {
  private logger = inject(LoggerService);

  // ============================================
  // RxJS Cache Storage Only
  // ============================================
  private allProjectsCache$: Observable<Project[]> | null = null;
  private projectCache = new Map<string, Observable<Project>>();
  private projectMembersCache = new Map<string, Observable<ProjectMember[]>>();

  // ============================================
  // Project CRUD Operations with Cache Invalidation
  // ============================================

  /**
   * Create a new project with cache invalidation
   */
  createProject(dto: CreateProjectDto): Observable<Project> {
    return this.http.post<ApiResponse<Project>>(this.buildUrl('/projects'), dto).pipe(
      map(response => response.data),
      tap(() => {
        this.invalidateAllProjectsCache();
        this.logger.info('Project created, cache invalidated');
      }),
      catchError((error) => {
        this.logger.error('Failed to create project: ' + error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all projects with RxJS caching (shareReplay)
   */
  getAllProjects(): Observable<Project[]> {
    if (!this.allProjectsCache$) {
      this.logger.info('Fetching all projects from API');
      this.allProjectsCache$ = this.http.get<ApiResponse<Project[]>>(this.buildUrl('/projects')).pipe(
        map(response => response.data),
      
        tap(() => this.logger.info('Projects cached')),
        shareReplay(1),
        catchError((error) => {
          this.allProjectsCache$ = null; // Invalidate on error
          return throwError(() => error);
        })
      );
    } else {
      this.logger.info('Using cached projects');
    }
    return this.allProjectsCache$;
  }

  /**
   * Get a single project by ID with RxJS caching
   */
  getProjectById(projectId: string): Observable<Project> {
    if (!this.projectCache.has(projectId)) {
      this.logger.info(`Fetching project ${projectId} from API`);
      this.projectCache.set(
        projectId,
        this.http.get<Project>(this.buildUrl(`/projects/${projectId}`)).pipe(
          tap(() => this.logger.info(`Project ${projectId} cached`)),
          shareReplay(1),
          catchError((error) => {
            this.projectCache.delete(projectId);
            return throwError(() => error);
          })
        )
      );
    } else {
      this.logger.info(`Using cached project ${projectId}`);
    }
    return this.projectCache.get(projectId)!;
  }

  /**
   * Update a project with cache invalidation
   */
  updateProject(projectId: string, dto: UpdateProjectDto): Observable<Project> {
    return this.http.patch<ApiResponse<Project>>(this.buildUrl(`/projects/${projectId}`), dto).pipe(
      map(response => response.data),
      tap(() => {
        this.invalidateProjectCache(projectId);
        this.invalidateAllProjectsCache();
        this.invalidateProjectMembersCache(projectId);
        this.logger.info(`Project ${projectId} updated, cache invalidated`);
      }),
      catchError((error) => {
        this.logger.error('Failed to update project: ' + error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a project with cache invalidation
   */
  deleteProject(projectId: string): Observable<void> {
    return this.http.delete<void>(this.buildUrl(`/projects/${projectId}`)).pipe(
      tap(() => {
        this.invalidateProjectCache(projectId);
        this.invalidateAllProjectsCache();
        this.invalidateProjectMembersCache(projectId);
        this.logger.info(`Project ${projectId} deleted, caches invalidated`);
      }),
      catchError((error) => {
        this.logger.error('Failed to delete project: ' + error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Archive/Unarchive a project with cache invalidation
   */
  toggleArchive(projectId: string, isArchived: boolean): Observable<Project> {
    const url = isArchived
      ? this.buildUrl(`/projects/${projectId}/archive`)
      : this.buildUrl(`/projects/${projectId}/unarchive`);
    return this.http.patch<Project>(url, {}).pipe(
      tap(() => {
        this.invalidateProjectCache(projectId);
        this.invalidateAllProjectsCache();
        this.logger.info(`Project ${projectId} archive toggled, cache invalidated`);
      }),
      catchError((error) => {
        this.logger.error('Failed to toggle archive: ' + error.message);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // Project Members Management with Cache Invalidation
  // ============================================

  /**
   * Get all members of a project with RxJS caching
   */
  getProjectMembers(projectId: string): Observable<ProjectMember[]> {
    if (!this.projectMembersCache.has(projectId)) {
      this.logger.info(`Fetching members for project ${projectId} from API`);
      this.projectMembersCache.set(
        projectId,
        this.http.get<{ data: ProjectMember[] }>(this.buildUrl(`/projects/${projectId}/members`)).pipe(
          map(response => response.data),
          tap(() => this.logger.info(`Members for project ${projectId} cached`)),
          shareReplay(1),
          catchError((error) => {
            this.projectMembersCache.delete(projectId);
            return throwError(() => error);
          })
        )
      );
    } else {
      this.logger.info(`Using cached members for project ${projectId}`);
    }
    return this.projectMembersCache.get(projectId)!;
  }

  /**
   * Add a member to the project with cache invalidation
   */
  addMember(projectId: string, dto: AddMemberDto): Observable<ProjectMember> {
    return this.http.post<{ data: ProjectMember }>(this.buildUrl(`/projects/${projectId}/members`), dto).pipe(
      map(response => response.data),
      tap(() => {
        this.invalidateProjectMembersCache(projectId);
        this.invalidateProjectCache(projectId);
        this.invalidateAllProjectsCache();
        this.logger.info(`Member added to project ${projectId}, cache invalidated`);
      }),
      catchError((error) => {
        this.logger.error('Failed to add member: ' + error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update member role with cache invalidation
   */
  updateMemberRole(
    projectId: string,
    memberId: string,
    dto: UpdateMemberDto
  ): Observable<ProjectMember> {
    return this.http.patch<ProjectMember>(
      this.buildUrl(`/projects/${projectId}/members/${memberId}`),
      dto
    ).pipe(
      tap(() => {
        this.invalidateProjectMembersCache(projectId);
        this.logger.info(`Member ${memberId} role updated, cache invalidated`);
      }),
      catchError((error) => {
        this.logger.error('Failed to update member role: ' + error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Remove a member from the project with cache invalidation
   */
  removeMember(projectId: string, memberId: string): Observable<void> {
    return this.http.delete<void>(this.buildUrl(`/projects/${projectId}/members/${memberId}`)).pipe(
      tap(() => {
        this.invalidateProjectMembersCache(projectId);
        this.invalidateProjectCache(projectId);
        this.invalidateAllProjectsCache();
        this.logger.info(`Member ${memberId} removed, cache invalidated`);
      }),
      catchError((error) => {
        this.logger.error('Failed to remove member: ' + error.message);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // Permission Checks
  // ============================================

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

  // ============================================
  // Cache Invalidation Methods (Private)
  // ============================================

  /**
   * Invalidate all projects cache
   */
  private invalidateAllProjectsCache(): void {
    this.allProjectsCache$ = null;
  }

  /**
   * Invalidate specific project cache
   */
  private invalidateProjectCache(projectId: string): void {
    this.projectCache.delete(projectId);
  }

  /**
   * Invalidate members cache for a specific project
   */
  private invalidateProjectMembersCache(projectId: string): void {
    this.projectMembersCache.delete(projectId);
  }

    /**
   * Clear all caches (call on logout)
   */
  clearCache(): void {
    this.allProjectsCache$ = null;
    this.projectCache.clear();
    this.projectMembersCache.clear();
    this.logger.info('All project caches cleared');
    this.projectMembersCache.clear();
    this.logger.info('All project caches cleared');
}
}

