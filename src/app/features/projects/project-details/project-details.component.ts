import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  ChangeDetectionStrategy,
  signal,
  effect,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectsService } from '../../../core/services/projects.service';
import { Project, ProjectMember } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailsComponent {
  private projectsService = inject(ProjectsService);
  private destroyRef = inject(DestroyRef);

  projectId: string = '';
  cachedProject: Project | null = null;
  @Output() close = new EventEmitter<void>();

  project = signal<Project | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  @Input()
  set projectIdInput(id: string) {
    this.projectId = id;
    if (id) {
      this.loadProject();
    }
  }

  @Input()
  set projectData(data: Project | null) {
    this.cachedProject = data;
    if (data) {
      this.project.set(data);
    }
  }

  private loadProject() {
    // If we have cached project data, use it immediately
    if (this.cachedProject) {
      this.project.set(this.cachedProject);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.projectsService
      .getProjectById(this.projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fetchedProject) => {
          // Merge fetched project with existing project to preserve tasks and members if missing
          const currentProject = this.project();
          const mergedProject = {
            ...fetchedProject,
            tasks: fetchedProject.tasks ?? currentProject?.tasks,
            members: fetchedProject.members ?? currentProject?.members,
          };
          this.project.set(mergedProject);
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('Failed to load project details');
          this.isLoading.set(false);
        },
      });
  }

  onClose() {
    this.close.emit();
  }

  getTaskCount(): number {
    return this.project()?.tasks?.length || 0;
  }

  getCompletedTaskCount(): number {
    return this.project()?.tasks?.filter((t) => t.status === 'DONE').length || 0;
  }

  getProgressPercentage(): number {
    const total = this.getTaskCount();
    if (total === 0) return 0;
    return (this.getCompletedTaskCount() / total) * 100;
  }

  getMemberCount(): number {
    return this.project()?.members?.length || 0;
  }

  getInitial(member: ProjectMember): string {
    const user = member.user as any;
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    return 'U';
  }

  getName(member: ProjectMember): string {
    const user = member.user as any;
    if (user?.firstName || user?.lastName) {
      return `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    }
    return user?.email || 'Unknown';
  }
}
