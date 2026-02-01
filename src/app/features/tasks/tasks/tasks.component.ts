import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TasksService, FilterTaskDto } from '../../../core/services/task.service';
import { ProjectsService } from '../../../core/services/projects.service';
import { LabelsService } from '../../../core/services/labels.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task, TaskStatus, TaskPriority, Label } from '../../../core/models/task.model';
import { Project } from '../../../core/models/project.model';

import { TaskCardComponent } from '../task-card/task-card.component';
import { TaskModalComponent } from '../task-modal/task-modal.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge.component';

type SortField = 'title' | 'priority' | 'dueDate' | 'status';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'table';

const priorityOrder: Record<TaskPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const statusOrder: Record<TaskStatus, number> = {
  TODO: 1,
  IN_PROGRESS: 2,
  IN_REVIEW: 3,
  DONE: 4,
};

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ScrollingModule,
    TaskCardComponent,
    TaskModalComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    PriorityBadgeComponent,
  ],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksComponent implements OnInit {
  private tasksService = inject(TasksService);
  private projectsService = inject(ProjectsService);
  private labelsService = inject(LabelsService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  // State signals
  isLoading = signal(true);
  tasks = signal<Task[]>([]);
  private tasksVersion = signal(0);
  selectedTask = signal<Task | null>(null);
  isModalOpen = signal(false);

  // Filter signals
  searchQuery = signal('');
  statusFilter = signal<TaskStatus | 'all'>('all');
  priorityFilter = signal<TaskPriority | 'all'>('all');
  projectFilter = signal<string>('all');
  labelFilter = signal<string>('all');

  // Sorting & view
  sortField = signal<SortField>('dueDate');
  sortOrder = signal<SortOrder>('asc');
  viewMode = signal<ViewMode>('grid');

  // Data from services
  user = this.authService.currentUserSignal;
  isAdmin = this.authService.isAdmin;
  availableProjects = this.projectsService.projects;
  availableLabels = this.labelsService.labels;

  private sortedCache = new Map<string, Task[]>();

  // Computed
  filteredAndSortedTasks = computed(() => {
    const version = this.tasksVersion();
    const query = this.searchQuery().toLowerCase();
    const status = this.statusFilter();
    const priority = this.priorityFilter();
    const project = this.projectFilter();
    const label = this.labelFilter();
    const sortField = this.sortField();
    const sortOrder = this.sortOrder();

    const cacheKey = `${version}|${query}|${status}|${priority}|${project}|${label}|${sortField}|${sortOrder}`;
    const cached = this.sortedCache.get(cacheKey);
    if (cached) return cached;

    let result = [...this.tasks()];

    // Search filter
    if (query) {
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (status !== 'all') {
      result = result.filter((task) => task.status === status);
    }

    // Priority filter
    if (priority !== 'all') {
      result = result.filter((task) => task.priority === priority);
    }

    // Project filter
    if (project !== 'all') {
      result = result.filter((task) => task.projectId === project);
    }

    // Label filter
    if (label !== 'all') {
      result = result.filter((task) => task.labels?.some((l) => l.id === label));
    }

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority':
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case 'status':
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'dueDate':
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          comparison = dateA - dateB;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    if (this.sortedCache.size > 20) {
      this.sortedCache.clear();
    }
    this.sortedCache.set(cacheKey, result);
    return result;
  });

  hasFilters = computed(() => {
    return (
      this.searchQuery() !== '' ||
      this.statusFilter() !== 'all' ||
      this.priorityFilter() !== 'all' ||
      this.projectFilter() !== 'all' ||
      this.labelFilter() !== 'all'
    );
  });

  // Extract plural task count label
  taskCountLabel = computed(() => {
    const count = this.filteredAndSortedTasks().length;
    return `${count} task${count !== 1 ? 's' : ''}`;
  });

  // Extract view mode button classes
  viewGridButtonClass = computed(() =>
    this.viewMode() === 'grid'
      ? 'h-8 w-8 rounded bg-secondary flex items-center justify-center'
      : 'h-8 w-8 rounded hover:bg-accent flex items-center justify-center transition-colors',
  );

  viewTableButtonClass = computed(() =>
    this.viewMode() === 'table'
      ? 'h-8 w-8 rounded bg-secondary flex items-center justify-center'
      : 'h-8 w-8 rounded hover:bg-accent flex items-center justify-center transition-colors',
  );

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.isLoading.set(true);

    // Load projects (service updates its own signal)
    this.projectsService.loadProjects().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    // Load labels (service updates its own signal)
    this.labelsService.getAllLabels().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    // Load tasks
    this.loadTasks();
  }

  private loadTasks() {
    const filters: FilterTaskDto = {};

    // Only add filters if they're set
    if (this.statusFilter() !== 'all') {
      filters.status = this.statusFilter() as TaskStatus;
    }
    if (this.priorityFilter() !== 'all') {
      filters.priority = this.priorityFilter() as TaskPriority;
    }
    if (this.labelFilter() !== 'all') {
      filters.labelId = this.labelFilter();
    }
    if (this.searchQuery()) {
      filters.search = this.searchQuery();
    }

    // Load tasks based on project filter
    if (this.projectFilter() !== 'all') {
      this.tasksService
        .getTasksByProject(this.projectFilter(), filters)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.tasks.set(response.data);
            this.tasksVersion.update((v) => v + 1);
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Failed to load tasks:', error);
            this.isLoading.set(false);
          },
        });
    } else {
      this.tasksService
        .getMyTasks(filters)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.tasks.set(response);
            this.tasksVersion.update((v) => v + 1);
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Failed to load tasks:', error);
            this.isLoading.set(false);
          },
        });
    }
  }

  // Filter methods
  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.loadTasks();
  }

  onStatusFilterChange(status: string) {
    this.statusFilter.set(status as TaskStatus | 'all');
    this.loadTasks();
  }

  onPriorityFilterChange(priority: string) {
    this.priorityFilter.set(priority as TaskPriority | 'all');
    this.loadTasks();
  }

  onProjectFilterChange(projectId: string) {
    this.projectFilter.set(projectId);
    this.loadTasks();
  }

  onLabelFilterChange(labelId: string) {
    this.labelFilter.set(labelId);
    this.loadTasks();
  }

  clearFilters() {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.priorityFilter.set('all');
    this.projectFilter.set('all');
    this.labelFilter.set('all');
    this.loadTasks();
  }

  // Sorting methods
  toggleSort(field: SortField) {
    if (this.sortField() === field) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('asc');
    }
  }

  // View methods
  setViewMode(mode: ViewMode) {
    this.viewMode.set(mode);
  }

  // Task actions
  openTaskModal(task?: Task) {
    this.selectedTask.set(task || null);
    this.isModalOpen.set(true);
  }

  closeTaskModal() {
    this.isModalOpen.set(false);
    this.selectedTask.set(null);
  }

  onModalOpenChange(open: boolean) {
    if (!open) {
      this.closeTaskModal();
    }
  }

  onTaskSaved() {
    this.loadTasks();
  }

  // Helper method to get project details
  getProjectById(projectId: string): { name: string; color: string } | null {
    const project = this.availableProjects()?.find((p) => p.id === projectId);
    return project
      ? { name: project.name, color: project.color ? project.color : '#000000' }
      : null;
  }

  // Helper for assignee display
  getAssigneeInitials(task: Task): string {
    const assignees = task.assignees;
    if (!assignees || assignees.length === 0) return 'U';
    const first = assignees[0];
    return first.firstName?.charAt(0)?.toUpperCase() || 'U';
  }

  trackByTaskId = (_index: number, task: Task) => task.id;
}
