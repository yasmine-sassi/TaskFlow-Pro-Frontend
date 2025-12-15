import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProjectsService } from '../../../core/services/projects.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project, ProjectMemberRole } from '../../../core/models/project.model';
import { UserRole } from '../../../core/models/user.model';
import { ProjectCardComponent } from '../project-card/project-card.component';
import { ProjectModalComponent } from '../project-modal/project-modal.component';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectCardComponent, ProjectModalComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
})
export class ProjectsComponent {
  private projectsService = inject(ProjectsService);
  private authService = inject(AuthService);

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
      const mode = this.adminFilter();
      if (mode === 'active') list = list.filter((p) => !p.isArchived);
      if (mode === 'archived') list = list.filter((p) => p.isArchived);
    }

    if (!query) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
  });

  constructor() {
    // Load projects on init
    effect(() => {
      this.loadProjects();
    });
  }

  private loadProjects() {
    this.isLoading.set(true);
    this.projectsService.getAllProjects().subscribe({
      next: (projects) => {
        console.log('📦 Loaded projects:', projects.length);
        
        // Fetch members for each project
        if (projects.length === 0) {
          this.projects.set([]);
          this.isLoading.set(false);
          return;
        }

        const projectsWithMembers$ = projects.map(project =>
          this.projectsService.getProjectMembers(project.id).pipe(
            map(members => {
              console.log(`👥 Members for ${project.name}:`, members.length, members);
              return { ...project, members };
            }),
            catchError(() => {
              console.warn(`Failed to load members for project ${project.id}`);
              return of({ ...project, members: [] });
            })
          )
        );

        forkJoin(projectsWithMembers$).subscribe({
          next: (enrichedProjects) => {
            console.log('✅ Enriched projects:', enrichedProjects);
            this.projects.set(this.filterVisibleProjects(enrichedProjects));
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Failed to enrich projects with members:', err);
            this.projects.set(this.filterVisibleProjects(projects)); // Fallback to projects without members
            this.isLoading.set(false);
          },
        });
      },
      error: (err) => {
        console.error('Failed to load projects:', err);
        this.isLoading.set(false);
      },
    });
  }

  onProjectCreated(newProject: Project) {
    // Fetch members for the newly created project (owner is auto-added)
    this.projectsService.getProjectMembers(newProject.id).subscribe({
      next: (members) => {
        const enrichedProject = { ...newProject, members };
        this.projects.update((current) => this.filterVisibleProjects([enrichedProject, ...current]));
      },
      error: () => {
        // Fallback: add project without members
        console.warn(`Failed to load members for new project ${newProject.id}`);
        this.projects.update((current) => this.filterVisibleProjects([{ ...newProject, members: [] }, ...current]));
      },
    });
    this.showModal.set(false);
    this.selectedProject.set(null);
  }

  onProjectDeleted(projectId: string) {
    this.projects.update((current) => current.filter((p) => p.id !== projectId));
  }

  onProjectUpdated(updatedProject: Project) {
    this.projects.update((current) =>
      this.filterVisibleProjects(current.map((p) => (p.id === updatedProject.id ? updatedProject : p)))
    );
    this.showModal.set(false);
    this.selectedProject.set(null);
  }

  onDeleteProject(projectId: string) {
    const user = this.currentUser();
    if (!user || user.role !== UserRole.ADMIN) return;
    this.projectsService.deleteProject(projectId).subscribe({
      next: () => {
        this.projects.update((current) => current.filter((p) => p.id !== projectId));
      },
      error: (err) => console.error('Failed to delete project:', err),
    });
  }

  onOpenEdit(project: Project) {
    const user = this.currentUser();
    if (!user) return;
    const canEdit = this.canEditProject(project);
    if (!canEdit) {
      console.warn('Edit not allowed: only ADMIN or owner can edit');
      return;
    }
    this.selectedProject.set(project);
    this.showModal.set(true);
  }

  canEditProject(project: Project): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.role === UserRole.ADMIN) return true;
    const isOwnerById = project.ownerId === user.id;
    const isOwnerByMembership = (project.members ?? []).some(
      (m) => m.userId === user.id && m.role === ProjectMemberRole.OWNER
    );
    return isOwnerById || isOwnerByMembership;
  }

  private filterVisibleProjects(projects: Project[]): Project[] {
    const user = this.currentUser();
    if (!user) return [];
    if (user.role === UserRole.ADMIN) return projects;

    return projects.filter((project) => {
      if (project.isArchived) return false;
      if (project.ownerId === user.id) return true;
      const members = project.members ?? [];
      return members.some((m) => m.userId === user.id);
    });
  }

  onArchiveProject(project: Project) {
    const user = this.currentUser();
    if (!user || user.role !== UserRole.ADMIN) return;
    this.projectsService.toggleArchive(project.id, true).subscribe({
      next: (updated) => {
        this.projects.update((current) =>
          this.filterVisibleProjects(current.map((p) => (p.id === project.id ? { ...p, isArchived: true } : p)))
        );
      },
      error: (err) => console.error('Failed to archive project:', err),
    });
  }

  onUnarchiveProject(project: Project) {
    const user = this.currentUser();
    if (!user || user.role !== UserRole.ADMIN) return;
    this.projectsService.toggleArchive(project.id, false).subscribe({
      next: (updated) => {
        this.projects.update((current) =>
          current.map((p) => (p.id === project.id ? { ...p, isArchived: false } : p))
        );
      },
      error: (err) => console.error('Failed to unarchive project:', err),
    });
  }
}
