import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError, map, of } from 'rxjs';
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
  // Signal-based State
  // ============================================
  
  // Main state signals
  private _projects = signal<Project[]>([]);
  private _projectMembers = signal<Map<string, ProjectMember[]>>(new Map());
  
  // Derived/computed signals
  projects = computed(() => this._projects());
  archivedProjects = computed(() => this._projects().filter(p => p.isArchived));
  activeProjects = computed(() => this._projects().filter(p => !p.isArchived));
  
  /**
   * Get project members for a specific project
   */
  getProjectMembers(projectId: string) {
    return computed(() => this._projectMembers().get(projectId) ?? []);
  }
  
  /**
   * Get a specific project by ID
   */
  project(projectId: string) {
    return computed(() => this._projects().find(p => p.id === projectId) ?? null);
  }

  // ============================================
  // Project CRUD Operations
  // ============================================

  /**
   * Create a new project
   */
  createProject(dto: CreateProjectDto): Observable<Project> {
    return this.http.post<ApiResponse<Project>>(this.buildUrl('/projects'), dto).pipe(
      map(response => response.data),
      tap((project) => {
        this._projects.update(projects => [...projects, project]);
        this.logger.info('Project created and added to state');
      }),
      catchError((error) => {
        this.logger.error('Failed to create project: ' + error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Load all projects from API
   */
  loadProjects(forceRefresh = false): Observable<Project[]> {
    if (this._projects().length > 0 && !forceRefresh) {
      this.logger.info('Using cached projects from state');
      return new Observable(subscriber => {
        subscriber.next(this._projects());
        subscriber.complete();
      });
    }

    this.logger.info('Loading projects from API');
    return this.http.get<ApiResponse<Project[]>>(this.buildUrl('/projects')).pipe(
      map(response => response.data),
      tap((projects) => {
        this._projects.set(projects);
        this.logger.info(`Projects loaded: ${projects.length}`);
      }),
      catchError((error) => {
        this.logger.error('Failed to load projects: ' + error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a single project by ID (fetches from API if not in state)
   */
  getProjectById(projectId: string, forceRefresh = false): Observable<Project> {
    const existingProject = this._projects().find(p => p.id === projectId);
    
    if (existingProject && !forceRefresh) {
      this.logger.info(`Using cached project ${projectId} from state`);
      return new Observable(subscriber => {
        subscriber.next(existingProject);
        subscriber.complete();
      });
    }

    this.logger.info(`Fetching project ${projectId} from API`);
    return this.http.get<Project>(this.buildUrl(`/projects/${projectId}`)).pipe(
      tap((project) => {
        // Update or add to projects state
        this._projects.update(projects => {
          const index = projects.findIndex(p => p.id === projectId);
          if (index >= 0) {
            // Update existing
            const updated = [...projects];
            updated[index] = project;
            return updated;
          } else {
            // Add new
            return [...projects, project];
          }
        });
        this.logger.info(`Project ${projectId} cached in state`);
      }),
      catchError((error) => {
        this.logger.error(`Failed to fetch project ${projectId}: ` + error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update a project
   */
  updateProject(projectId: string, dto: UpdateProjectDto): Observable<Project> {
    return this.http.patch<ApiResponse<Project>>(this.buildUrl(`/projects/${projectId}`), dto).pipe(
      map(response => response.data),
      tap((project) => {
        // Update in projects state
        this._projects.update(projects => 
          projects.map(p => p.id === projectId ? project : p)
        );
        this.logger.info(`Project ${projectId} updated in state`);
      }),
      catchError((error) => {
        this.logger.error('Failed to update project: ' + error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a project
   */
  deleteProject(projectId: string): Observable<void> {
    return this.http.delete<void>(this.buildUrl(`/projects/${projectId}`)).pipe(
      tap(() => {
        // Remove from projects state
        this._projects.update(projects => 
          projects.filter(p => p.id !== projectId)
        );
        // Remove members cache
        this._projectMembers.update(members => {
          const updated = new Map(members);
          updated.delete(projectId);
          return updated;
        });
        this.logger.info(`Project ${projectId} removed from state`);
      }),
      catchError((error) => {
        this.logger.error('Failed to delete project: ' + error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Archive/Unarchive a project
   */
  toggleArchive(projectId: string, isArchived: boolean): Observable<Project> {
    const url = isArchived
      ? this.buildUrl(`/projects/${projectId}/archive`)
      : this.buildUrl(`/projects/${projectId}/unarchive`);
    return this.http.patch<Project>(url, {}).pipe(
      tap((project) => {
        // Update in projects state
        this._projects.update(projects => 
          projects.map(p => p.id === projectId ? project : p)
        );
        this.logger.info(`Project ${projectId} archive toggled in state`);
      }),
      catchError((error) => {
        this.logger.error('Failed to toggle archive: ' + error.message);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // Project Members Management
  // ============================================

  /**
   * Load members for a project
   */
  loadProjectMembers(projectId: string, forceRefresh = false): Observable<ProjectMember[]> {
    const cachedMembers = this._projectMembers().get(projectId);
    
    if (cachedMembers && !forceRefresh) {
      this.logger.info(`Using cached members for project ${projectId}`);
      return new Observable(subscriber => {
        subscriber.next(cachedMembers);
        subscriber.complete();
      });
    }

    this.logger.info(`Loading members for project ${projectId} from API`);
    return this.http.get<{ data: ProjectMember[] }>(this.buildUrl(`/projects/${projectId}/members`)).pipe(
      map(response => response.data),
      tap((members) => {
        this._projectMembers.update(current => {
          const updated = new Map(current);
          updated.set(projectId, members);
          return updated;
        });
        this.logger.info(`Members loaded for project ${projectId}: ${members.length}`);
      }),
      catchError((error) => {
        this.logger.error(`Failed to load members for project ${projectId}: ` + error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add a member to the project
   */
  addMember(projectId: string, dto: AddMemberDto): Observable<ProjectMember> {
    return this.http.post<ApiResponse<ProjectMember>>(this.buildUrl(`/projects/${projectId}/members`), dto).pipe(
      map(response => response.data),
      tap((member) => {
        // Update members cache
        this._projectMembers.update(current => {
          const updated = new Map(current);
          const existingMembers = updated.get(projectId) || [];
          updated.set(projectId, [...existingMembers, member]);
          return updated;
        });
        
        // Also update the project in state if it exists
        this._projects.update(projects => 
          projects.map(project => {
            if (project.id === projectId) {
              return {
                ...project,
                members: [...(project.members || []), member]
              };
            }
            return project;
          })
        );
        
        this.logger.info(`Member added to project ${projectId}`);
      }),
      catchError((error) => {
        this.logger.error('Failed to add member: ' + error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update member role
   */
  updateMemberRole(
    projectId: string,
    memberId: string,
    dto: UpdateMemberDto
  ): Observable<ProjectMember> {
    return this.http.patch<ApiResponse<ProjectMember>>(
      this.buildUrl(`/projects/${projectId}/members/${memberId}`),
      dto
    ).pipe(
      map(response => response.data),
      tap((updatedMember) => {
        // Update members cache
        this._projectMembers.update(current => {
          const updated = new Map(current);
          const members = updated.get(projectId);
          if (members) {
            const updatedMembers = members.map(member => 
              member.id === memberId ? updatedMember : member
            );
            updated.set(projectId, updatedMembers);
          }
          return updated;
        });
        
        // Update project state if cached
        this._projects.update(projects => 
          projects.map(project => {
            if (project.id === projectId && project.members) {
              const updatedMembers = project.members.map(member => 
                member.id === memberId ? updatedMember : member
              );
              return { ...project, members: updatedMembers };
            }
            return project;
          })
        );
        
        this.logger.info(`Member ${memberId} role updated`);
      }),
      catchError((error) => {
        this.logger.error('Failed to update member role: ' + error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Remove a member from the project
   */
  removeMember(projectId: string, memberId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(this.buildUrl(`/projects/${projectId}/members/${memberId}`)).pipe(
      map(response => response.data),
      tap(() => {
        // Update members cache
        this._projectMembers.update(current => {
          const updated = new Map(current);
          const members = updated.get(projectId);
          if (members) {
            const updatedMembers = members.filter(member => member.id !== memberId);
            updated.set(projectId, updatedMembers);
          }
          return updated;
        });
        
        // Update project state if cached
        this._projects.update(projects => 
          projects.map(project => {
            if (project.id === projectId && project.members) {
              const updatedMembers = project.members.filter(member => member.id !== memberId);
              return { ...project, members: updatedMembers };
            }
            return project;
          })
        );
        
        this.logger.info(`Member ${memberId} removed from project ${projectId}`);
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
   * Check if a project name already exists (excluding optional projectId)
   */
  checkProjectNameExists(projectName: string, excludeProjectId?: string): Observable<boolean> {
    return this.http.get<ApiResponse<boolean>>(
      this.buildUrl(`/projects/check-name/${encodeURIComponent(projectName)}`),
      { params: excludeProjectId ? { excludeId: excludeProjectId } : {} }
    ).pipe(
      map(response => response.data ?? false),
      catchError((error) => {
        this.logger.error('Failed to check project name existence: ' + error.message);
        // Return false on error to allow user to proceed (fail gracefully)
        return of(false);
      })
    );
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
  // State Management
  // ============================================

  /**
   * Clear all state (call on logout)
   */
  clearState(): void {
    this._projects.set([]);
    this._projectMembers.set(new Map());
    this.logger.info('Project state cleared');
  }

  /**
   * Manually update project in state (for optimistic updates)
   */
  updateProjectState(projectId: string, updates: Partial<Project>): void {
    this._projects.update(projects => 
      projects.map(p => p.id === projectId ? { ...p, ...updates } : p)
    );
    this.logger.info(`Project ${projectId} state updated manually`);
  }

  /**
   * Manually add project to state
   */
  addProjectToState(project: Project): void {
    this._projects.update(projects => {
      // Don't add if already exists
      if (projects.some(p => p.id === project.id)) {
        return projects.map(p => p.id === project.id ? project : p);
      }
      return [...projects, project];
    });
    this.logger.info(`Project ${project.id} added to state manually`);
  }

  /**
   * Manually remove project from state
   */
  removeProjectFromState(projectId: string): void {
    this._projects.update(projects => 
      projects.filter(p => p.id !== projectId)
    );
    this._projectMembers.update(members => {
      const updated = new Map(members);
      updated.delete(projectId);
      return updated;
    });
    this.logger.info(`Project ${projectId} removed from state manually`);
  }
}
