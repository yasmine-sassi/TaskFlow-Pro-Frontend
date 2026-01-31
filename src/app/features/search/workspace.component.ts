import {
  Component,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { mergeMap, catchError, finalize } from 'rxjs/operators';
import { LucideIconComponent } from '../../shared/components/lucide-icon/lucide-icon.component';
import { TasksService } from '../../core/services/task.service';
import { ProjectsService } from '../../core/services/projects.service';
import { LoggerService } from '../../core/services/logger.service';
import { Task } from '../../core/models/task.model';
import { Project } from '../../core/models/project.model';

interface PaginationState {
  projectId: string;
  displayLimit: number;
  isLoadingMore: boolean;
  hasMoreTasks: boolean;
  allTasksLoaded: boolean;
  totalTasks: number; // Track total from backend
}

interface ProjectWithTasks {
  project: Project;
  tasks: Task[];
  paginationState: PaginationState;
}

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, LucideIconComponent],
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceComponent implements OnInit {
  private router = inject(Router);
  private logger = inject(LoggerService);
  private tasksService = inject(TasksService);
  private projectsService = inject(ProjectsService);

  // Constants
  private readonly INITIAL_DISPLAY_LIMIT = 2;
  private readonly LOAD_MORE_LIMIT = 2;

  // Signals for state management
  initialLoading = signal(true);
  error = signal<string | null>(null);

  // Data signals
  projectsWithTasks = signal<ProjectWithTasks[]>([]);

  // Modal state
  selectedTask = signal<Task | null>(null);
  isTaskModalOpen = signal(false);

  // Computed signals
  totalProjects = computed(() => this.projectsWithTasks().length);
  totalTasks = computed(() =>
    this.projectsWithTasks().reduce((sum, pwt) => sum + pwt.tasks.length, 0)
  );
  showEmptyState = computed(
    () => this.totalProjects() === 0 && !this.initialLoading()
  );

  ngOnInit() {
    this.loadWorkspaceContent();
  }

  /**
   * Load all projects and their tasks for the workspace
   */
  private loadWorkspaceContent(): void {
    this.initialLoading.set(true);
    this.error.set(null);

    this.projectsService
      .loadProjects()
      .pipe(
        mergeMap((projects) => {
          if (projects.length === 0) {
            return of([]);
          }

          // Load initial tasks for each project (first batch with pagination)
          const taskObservables = projects.map((project) =>
            this.tasksService.getTasksByProject(project.id, {
              page: 1,
              limit: this.INITIAL_DISPLAY_LIMIT,
            }).pipe(
              mergeMap((result) => {
                // Extract tasks and calculate if more exist
                const tasks = result.data || [];
                const hasMore = tasks.length >= this.INITIAL_DISPLAY_LIMIT; // If we got 2, there might be more
                
                return of({
                  project,
                  tasks,
                  totalTasksCount: tasks.length,
                  hasMore,
                });
              }),
              catchError((error) => {
                this.logger.error(
                  `Failed to load tasks for project ${project.name}: ${error.message}`
                );
                return of({
                  project,
                  tasks: [],
                  totalTasksCount: 0,
                  hasMore: false,
                });
              })
            )
          );

          return forkJoin(taskObservables);
        }),
        finalize(() => this.initialLoading.set(false))
      )
      .subscribe({
        next: (projectsData: any[]) => {
          const formattedData: ProjectWithTasks[] = projectsData.map((pd) => ({
            project: pd.project,
            tasks: pd.tasks,
            paginationState: {
              projectId: pd.project.id,
              displayLimit: this.INITIAL_DISPLAY_LIMIT,
              isLoadingMore: false,
              hasMoreTasks: pd.hasMore && pd.tasks.length > 0,
              allTasksLoaded: !pd.hasMore || pd.tasks.length === 0,
              totalTasks: pd.totalTasksCount,
            },
          }));
          this.projectsWithTasks.set(formattedData);
          this.logger.info(
            `Loaded workspace: ${formattedData.length} projects`
          );
        },
        error: (err) => {
          this.logger.error('Failed to load workspace: ' + err.message);
          this.error.set('Failed to load your workspace. Please try again.');
        },
      });
  }

  /**
   * Load more tasks for a specific project
   */
  loadMoreTasks(projectId: string) {
    const projectData = this.projectsWithTasks().find(
      (pwt) => pwt.project.id === projectId
    );

    if (!projectData || !this.canLoadMore(projectId)) {
      return; // Don't load if no more tasks or project not found
    }

    // Set loading state
    this.projectsWithTasks.update((projects) =>
      projects.map((pwt) =>
        pwt.project.id === projectId
          ? {
              ...pwt,
              paginationState: {
                ...pwt.paginationState,
                isLoadingMore: true,
              },
            }
          : pwt
      )
    );

    // Calculate next page (based on how many tasks are already loaded)
    const currentLoadedCount = projectData.tasks.length;
    const nextPage = Math.floor(currentLoadedCount / this.LOAD_MORE_LIMIT) + 1;

    this.logger.info(
      `Loading more tasks for project ${projectId}, page: ${nextPage}`
    );

    // Fetch next batch of tasks with pagination filter
    this.tasksService
      .getTasksByProject(projectId, {
        page: nextPage,
        limit: this.LOAD_MORE_LIMIT,
      })
      .pipe(
        finalize(() => {
          // Reset loading state
          this.projectsWithTasks.update((projects) =>
            projects.map((pwt) =>
              pwt.project.id === projectId
                ? {
                    ...pwt,
                    paginationState: {
                      ...pwt.paginationState,
                      isLoadingMore: false,
                    },
                  }
                : pwt
            )
          );
        })
      )
      .subscribe({
        next: (result) => {
          const newTasks = result.data || [];

          // Update project with new tasks and pagination state
          this.projectsWithTasks.update((projects) =>
            projects.map((pwt) =>
              pwt.project.id === projectId
                ? {
                    ...pwt,
                    tasks: [...pwt.tasks, ...newTasks],
                    paginationState: {
                      ...pwt.paginationState,
                      displayLimit: pwt.paginationState.displayLimit + this.LOAD_MORE_LIMIT,
                       hasMoreTasks: newTasks.length >= this.LOAD_MORE_LIMIT,
                       allTasksLoaded: newTasks.length < this.LOAD_MORE_LIMIT,
                       totalTasks: pwt.paginationState.totalTasks + newTasks.length,
                    },
                  }
                : pwt
            )
          );

          this.logger.info(
            `Loaded ${newTasks.length} more tasks for project ${projectId}`
          );
        },
        error: (err) => {
          this.logger.error(
            `Failed to load more tasks for project ${projectId}: ${err.message}`
          );
        },
      });
  }

  /**
   * Computed signal: Determine if load more should trigger a request
   */
  canLoadMore = (projectId: string): boolean => {
    const projectData = this.projectsWithTasks().find(
      (pwt) => pwt.project.id === projectId
    );
    return projectData?.paginationState.hasMoreTasks ?? false;
  };

  /**
   * Computed signal: Get displayed tasks for a project
   */
  getDisplayedTasks = (projectId: string): Task[] => {
    const projectData = this.projectsWithTasks().find(
      (pwt) => pwt.project.id === projectId
    );
    if (!projectData) return [];
    return projectData.tasks.slice(0, projectData.paginationState.displayLimit);
  };

  /**
   * Computed signal: Check if load more is in progress
   */
  isLoadingMore = (projectId: string): boolean => {
    const projectData = this.projectsWithTasks().find(
      (pwt) => pwt.project.id === projectId
    );
    return projectData?.paginationState.isLoadingMore ?? false;
  };

  /**
   * Open task details modal
   */
  openTaskModal(task: Task) {
    this.selectedTask.set(task);
    this.isTaskModalOpen.set(true);
  }

  /**
   * Close task details modal
   */
  closeTaskModal() {
    this.isTaskModalOpen.set(false);
    this.selectedTask.set(null);
  }

  /**
   * Close modal on backdrop click
   */
  onModalBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement)?.id === 'task-modal-backdrop') {
      this.closeTaskModal();
    }
  }

  /**
   * Navigate to tasks page
   */
  navigateToTask(task: Task) {
    this.logger.info('Navigating to task: ' + task.id);
    this.router.navigate(['/tasks']);
  }

  /**
   * Navigate to projects page
   */
  navigateToProject(project: Project) {
    this.logger.info('Navigating to project: ' + project.id);
    this.router.navigate(['/projects']);
  }

  /**
   * Get project color for badge
   */
  getProjectColor(projectId: string): string {
    const projectData = this.projectsWithTasks().find(
      (pwt) => pwt.project.id === projectId
    );
    return projectData?.project.color || '#6366f1';
  }
}
