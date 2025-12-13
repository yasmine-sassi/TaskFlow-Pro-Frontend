import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Project, ProjectMember, ProjectMemberRole } from '../models/project.model';
import { BaseService } from './base.service';
import { LoggerService } from './logger.service';

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
  private logger = inject(LoggerService);

  // Signals for state management
  projectsSignal = signal<Project[]>([]);
  currentProjectSignal = signal<Project | null>(null);
  selectedProjectMembersSignal = signal<ProjectMember[]>([]);
  loadingSignal = signal<boolean>(false);
  errorSignal = signal<string | null>(null);

  // Computed properties for derived states
  activeProjects = computed(() => this.projectsSignal().filter(p => !p.isArchived));
  archivedProjects = computed(() => this.projectsSignal().filter(p => p.isArchived));
  currentProjectMembers = computed(() => this.selectedProjectMembersSignal());
  hasActiveProjects = computed(() => this.activeProjects().length > 0);

  constructor() {
    super();
    // Effects for side effects
    effect(() => {
      const projects = this.projectsSignal();
      this.logger.info(`Projects updated: ${projects.length} projects loaded`);
    });

    effect(() => {
      const error = this.errorSignal();
      if (error) {
        this.logger.error(`Projects error: ${error}`);
      }
    });
  }
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

  // ============================================
  // Signal-Based State Management Methods
  // ============================================

  /**
   * Load all projects and update signals
   */
  loadProjects(): Observable<Project[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.getAllProjects().pipe(
      tap((projects) => {
        this.projectsSignal.set(projects);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to load projects');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Set the current selected project
   */
  setCurrentProject(projectId: string | null): void {
    if (projectId) {
      const project = this.projectsSignal().find(p => p.id === projectId);
      this.currentProjectSignal.set(project || null);
      if (project) {
        this.loadProjectMembers(projectId);
      } else {
        this.selectedProjectMembersSignal.set([]);
      }
    } else {
      this.currentProjectSignal.set(null);
      this.selectedProjectMembersSignal.set([]);
    }
  }

  /**
   * Load members for the selected project
   */
  loadProjectMembers(projectId: string): Observable<ProjectMember[]> {
    return this.getProjectMembers(projectId).pipe(
      tap((members) => {
        this.selectedProjectMembersSignal.set(members);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to load project members');
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new project and update signals
   */
  createProjectWithSignal(dto: CreateProjectDto): Observable<Project> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.createProject(dto).pipe(
      tap((newProject) => {
        this.projectsSignal.update(projects => [...projects, newProject]);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to create project');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update a project and update signals
   */
  updateProjectWithSignal(projectId: string, dto: UpdateProjectDto): Observable<Project> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.updateProject(projectId, dto).pipe(
      tap((updatedProject) => {
        this.projectsSignal.update(projects =>
          projects.map(p => p.id === projectId ? updatedProject : p)
        );
        if (this.currentProjectSignal()?.id === projectId) {
          this.currentProjectSignal.set(updatedProject);
        }
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to update project');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a project and update signals
   */
  deleteProjectWithSignal(projectId: string): Observable<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.deleteProject(projectId).pipe(
      tap(() => {
        this.projectsSignal.update(projects => projects.filter(p => p.id !== projectId));
        if (this.currentProjectSignal()?.id === projectId) {
          this.currentProjectSignal.set(null);
          this.selectedProjectMembersSignal.set([]);
        }
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to delete project');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Toggle archive status and update signals
   */
  toggleArchiveWithSignal(projectId: string, isArchived: boolean): Observable<Project> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.toggleArchive(projectId, isArchived).pipe(
      tap((updatedProject) => {
        this.projectsSignal.update(projects =>
          projects.map(p => p.id === projectId ? updatedProject : p)
        );
        if (this.currentProjectSignal()?.id === projectId) {
          this.currentProjectSignal.set(updatedProject);
        }
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to toggle archive status');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Reset all signals
   */
  resetState(): void {
    this.projectsSignal.set([]);
    this.currentProjectSignal.set(null);
    this.selectedProjectMembersSignal.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}
