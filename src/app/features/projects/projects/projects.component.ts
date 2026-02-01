import {
  Component,
  inject,
  signal,
  computed,
  effect,
  untracked,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectsService } from '../../../core/services/projects.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project, ProjectMemberRole } from '../../../core/models/project.model';
import { UserRole } from '../../../core/models/user.model';
import { ProjectCardComponent } from '../project-card/project-card.component';
import { ProjectModalComponent } from '../project-modal/project-modal.component';

@Component({
  selector: 'app-projects.component',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectCardComponent, ProjectModalComponent],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsComponent {
  private projectsService = inject(ProjectsService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  currentUser = this.authService.currentUserSignal;
  UserRole = UserRole;

  // Signals
  projects = signal<Project[]>([]);
  searchQuery = signal('');
  showModal = signal(false);
  selectedProject = signal<Project | null>(null);
  isLoading = signal(false);
  // Admin-only: filter by archive state
  adminFilter = signal<'all' | 'active' | 'archived'>('all');

  // Computed - filtered projects
  filteredProjects = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const user = this.currentUser();
    let list = this.projects();

    if (user?.role === UserRole.ADMIN) {
      // Admins can filter by archive state
      const mode = this.adminFilter();
      if (mode === 'active') list = list.filter((p) => !p.isArchived);
      if (mode === 'archived') list = list.filter((p) => p.isArchived);
    } else {
      // Regular users should NOT see archived projects
      list = list.filter((p) => !p.isArchived);
    }

    if (!query) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)),
    );
  });

  // Extract empty state title
  emptyStateTitle = computed(() => {
    if (this.searchQuery()) return 'No matching projects';
    return 'No projects yet';
  });

  // Extract empty state description
  emptyStateDescription = computed(() => {
    const user = this.currentUser();
    if (this.searchQuery()) return 'Try adjusting your search';
    if (user?.role === UserRole.ADMIN) return 'Get started by creating your first project';
    return 'You are not assigned to any projects yet';
  });

  // Extract project count label
  projectCountLabel = computed(() => {
    const count = this.filteredProjects().length;
    return `${count} project${count !== 1 ? 's' : ''}`;
  });

  // Memoize admin role check to avoid repeated calls
  isCurrentUserAdmin = computed(() => this.currentUser()?.role === UserRole.ADMIN);

  // Memoize empty state creation button visibility
  showCreateInEmptyState = computed(() => !this.searchQuery() && this.isCurrentUserAdmin());
  constructor() {
    // Load projects when the current user is available.
    // Use untracked() to avoid re-running due to service cache updates.
    effect(() => {
      const userId = this.currentUser()?.id;
      if (!userId) {
        this.projects.set([]);
        return;
      }
      untracked(() => this.loadProjects());
    });
  }

  private loadProjects() {
    this.isLoading.set(true);
    this.projectsService
      .loadProjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projects) => {
          // Backend now returns projects with members and tasks included
          // No need for additional API calls - N+1 problem solved!
          this.projects.set(this.filterVisibleProjects(projects));
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  onProjectCreated(newProject: Project) {
    // Backend returns complete project with members, tasks, and owner
    this.projects.update((current) =>
      this.filterVisibleProjects([newProject, ...current]),
    );
    this.showModal.set(false);
    this.selectedProject.set(null);
  }

  onProjectDeleted(projectId: string) {
    this.projects.update((current) => current.filter((p) => p.id !== projectId));
  }

  onProjectUpdated(updatedProject: Project) {
    this.projects.update((current) =>
      this.filterVisibleProjects(
        current.map((p) => (p.id === updatedProject.id ? updatedProject : p)),
      ),
    );
    this.showModal.set(false);
    this.selectedProject.set(null);
  }

  onDeleteProject(projectId: string) {
    const user = this.currentUser();
    if (!user || user.role !== UserRole.ADMIN) return;
    this.projectsService
      .deleteProject(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.projects.update((current) => current.filter((p) => p.id !== projectId));
        },
        error: () => {},
      });
  }

  onOpenEdit(project: Project) {
    const user = this.currentUser();
    if (!user) return;
    const canEdit = this.canEditProject(project);
    if (!canEdit) {
      return;
    }
    this.selectedProject.set(project);
    this.showModal.set(true);
  }

  onCreateNewProject() {
    this.selectedProject.set(null);
    this.showModal.set(true);
  }

  canEditProject(project: Project): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.role === UserRole.ADMIN) return true;
    const isOwnerById = project.ownerId === user.id;
    const isOwnerByMembership = (project.members ?? []).some(
      (m) => m.userId === user.id && m.role === ProjectMemberRole.OWNER,
    );
    return isOwnerById || isOwnerByMembership;
  }

  private filterVisibleProjects(projects: Project[]): Project[] {
    const user = this.currentUser();
    if (!user) return [];
    // Backend already scopes non-admin visibility; return as-is. Admins are already included by backend too.
    return projects;
  }

  onArchiveProject(project: Project) {
    const user = this.currentUser();
    if (!user || user.role !== UserRole.ADMIN) return;
    this.projectsService
      .toggleArchive(project.id, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.projects.update((current) =>
            this.filterVisibleProjects(
              current.map((p) => (p.id === project.id ? { ...p, isArchived: true } : p)),
            ),
          );
        },
        error: () => {},
      });
  }

  onUnarchiveProject(project: Project) {
    const user = this.currentUser();
    if (!user || user.role !== UserRole.ADMIN) return;
    this.projectsService
      .toggleArchive(project.id, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.projects.update((current) =>
            current.map((p) => (p.id === project.id ? { ...p, isArchived: false } : p)),
          );
        },
        error: () => {},
      });
  }
}
