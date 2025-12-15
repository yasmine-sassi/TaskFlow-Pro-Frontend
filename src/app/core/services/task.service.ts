import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { Task, TaskStatus, TaskPriority } from '../models/task.model';
import { BaseService } from './base.service';
import { LoggerService } from './logger.service';
import { UsersService } from './users.service';

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  position?: number;
  projectId: string;
  assigneeIds?: string[];
  labelIds?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  position?: number;
  labelId?: string;
}

export interface FilterTaskDto {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  search?: string;
  labelId?: string;
  page?: number;
  limit?: number;
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
export class TasksService extends BaseService {
  private logger = inject(LoggerService);
  private usersService = inject(UsersService);

  // Signals for state management
  tasksSignal = signal<Task[]>([]);
  loadingSignal = signal<boolean>(false);
  errorSignal = signal<string | null>(null);

  // Filter signals
  statusFilterSignal = signal<TaskStatus | null>(null);
  priorityFilterSignal = signal<TaskPriority | null>(null);
  assigneeFilterSignal = signal<string | null>(null);
  searchFilterSignal = signal<string>('');
  labelFilterSignal = signal<string | null>(null);

  // Computed properties for derived states
  filteredTasksSignal = computed(() => {
    const tasks = this.tasksSignal();
    const statusFilter = this.statusFilterSignal();
    const priorityFilter = this.priorityFilterSignal();
    const assigneeFilter = this.assigneeFilterSignal();
    const labelFilter = this.labelFilterSignal();
    const searchFilter = this.searchFilterSignal().toLowerCase();

    return tasks.filter(task => {
      // Status filter
      if (statusFilter && task.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter && task.priority !== priorityFilter) {
        return false;
      }

      // Assignee filter
      if (assigneeFilter && !task.assignees?.some(assignee => assignee.id === assigneeFilter)) {
        return false;
      }
      if (labelFilter && !task.labels?.some(l => l.id === labelFilter)) return false;

      // Search filter (title and description)
      if (searchFilter) {
        const titleMatch = task.title.toLowerCase().includes(searchFilter);
        const descriptionMatch = task.description?.toLowerCase().includes(searchFilter) || false;
        if (!titleMatch && !descriptionMatch) {
          return false;
        }
      }

      return true;
    });
  });

  // Additional computed properties
  todoTasks = computed(() => this.tasksSignal().filter(t => t.status === TaskStatus.TODO));
  inProgressTasks = computed(() => this.tasksSignal().filter(t => t.status === TaskStatus.IN_PROGRESS));
  doneTasks = computed(() => this.tasksSignal().filter(t => t.status === TaskStatus.DONE));
  highPriorityTasks = computed(() => this.tasksSignal().filter(t => t.priority === TaskPriority.HIGH || t.priority === TaskPriority.URGENT));

  // Required computed signals
  tasksGroupedByStatus = computed(() => {
    const tasks = this.tasksSignal();
    return {
      [TaskStatus.TODO]: tasks.filter(t => t.status === TaskStatus.TODO),
      [TaskStatus.IN_PROGRESS]: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS),
      [TaskStatus.IN_REVIEW]: tasks.filter(t => t.status === TaskStatus.IN_REVIEW),
      [TaskStatus.DONE]: tasks.filter(t => t.status === TaskStatus.DONE),
    };
  });

  userTasksCount = computed(() => {
    const currentUser = this.usersService.currentUserSignal();
    if (!currentUser) return 0;
    return this.tasksSignal().filter(task =>
      task.assignees?.some(assignee => assignee.id === currentUser.id)
    ).length;
  });

  overdueTasks = computed(() => {
    const now = new Date();
    return this.tasksSignal().filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < now && task.status !== TaskStatus.DONE;
    });
  });

  constructor() {
    super();
    // Effects for side effects
    effect(() => {
      const tasks = this.tasksSignal();
      this.logger.info(`Tasks updated: ${tasks.length} tasks loaded`);
    });

    effect(() => {
      const filtered = this.filteredTasksSignal();
      this.logger.info(`Filtered tasks: ${filtered.length} tasks match current filters`);
    });

    effect(() => {
      const error = this.errorSignal();
      if (error) {
        this.logger.error(`Tasks error: ${error}`);
      }
    });
  }
  /**
   * Create a new task
   */
  createTask(dto: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(this.buildUrl('/tasks'), dto);
  }

  /**
   * Get all tasks for a project with optional filters
   */
  getTasksByProject(projectId: string, filter?: FilterTaskDto): Observable<ApiResponse<Task[]>> {
    let params = new HttpParams();

    if (filter) {
      if (filter.status) params = params.set('status', filter.status);
      if (filter.priority) params = params.set('priority', filter.priority);
      if (filter.assigneeId) params = params.set('assigneeId', filter.assigneeId);
      if (filter.labelId) params = params.set('labelId', filter.labelId);
      if (filter.search) params = params.set('search', filter.search);
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.limit) params = params.set('limit', filter.limit.toString());
    }

    return this.http.get<ApiResponse<Task[]>>(this.buildUrl(`/tasks/project/${projectId}`), {
      params,
    });
  }

  /**
   * Get all tasks assigned to the authenticated user
   */
  getMyTasks(filter?: FilterTaskDto): Observable<Task[]> {
    let params = new HttpParams();

    if (filter) {
      if (filter.status) params = params.set('status', filter.status);
      if (filter.priority) params = params.set('priority', filter.priority);
      if (filter.search) params = params.set('search', filter.search);
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.limit) params = params.set('limit', filter.limit.toString());
    }

    return this.http.get<ApiResponse<Task[]>>(this.buildUrl('/tasks/my-tasks'), {
      params,
      withCredentials: true,
    }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get a single task by ID
   */
  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(this.buildUrl(`/tasks/${id}`));
  }

  /**
   * Update a task
   */
  updateTask(id: string, dto: UpdateTaskDto): Observable<Task> {
    return this.http.patch<Task>(this.buildUrl(`/tasks/${id}`), dto);
  }

  /**
   * Delete a task
   */
  deleteTask(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(this.buildUrl(`/tasks/${id}`));
  }

  /**
   * Move task to a different status
   */
  moveTask(taskId: string, newStatus: TaskStatus): Observable<Task> {
    return this.updateTask(taskId, { status: newStatus });
  }

  /**
   * Assign a user to a task
   */
  assignUser(taskId: string, userId: string): Observable<Task> {
    return this.http.post<Task>(this.buildUrl(`/tasks/${taskId}/assign`), { userId });
  }

  /**
   * Unassign a user from a task
   */
  unassignUser(taskId: string, userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      this.buildUrl(`/tasks/${taskId}/assign/${userId}`)
    );
  }

  // ============================================
  // Signal-Based State Management Methods
  // ============================================

  /**
   * Load tasks for a project and update signals
   */
  loadTasksByProject(projectId: string, filter?: FilterTaskDto): Observable<ApiResponse<Task[]>> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.getTasksByProject(projectId, filter).pipe(
      tap((response) => {
        this.tasksSignal.set(response.data);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to load tasks');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Load user's assigned tasks and update signals
   */
  loadMyTasks(filter?: FilterTaskDto): Observable<Task[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.getMyTasks(filter).pipe(
      tap((response) => {
        this.tasksSignal.set(response);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to load my tasks');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new task and update signals
   */
  createTaskWithSignal(dto: CreateTaskDto): Observable<Task> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.createTask(dto).pipe(
      tap((newTask) => {
        this.tasksSignal.update(tasks => [...tasks, newTask]);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to create task');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update a task and update signals
   */
  updateTaskWithSignal(id: string, dto: UpdateTaskDto): Observable<Task> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.updateTask(id, dto).pipe(
      tap((updatedTask) => {
        this.tasksSignal.update(tasks =>
          tasks.map(t => t.id === id ? updatedTask : t)
        );
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to update task');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a task and update signals
   */
  deleteTaskWithSignal(id: string): Observable<{ message: string }> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.deleteTask(id).pipe(
      tap(() => {
        this.tasksSignal.update(tasks => tasks.filter(t => t.id !== id));
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to delete task');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Move task to different status and update signals
   */
  moveTaskWithSignal(taskId: string, newStatus: TaskStatus): Observable<Task> {
    return this.updateTaskWithSignal(taskId, { status: newStatus });
  }

  /**
   * Assign user to task and update signals
   */
  assignUserWithSignal(taskId: string, userId: string): Observable<Task> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.assignUser(taskId, userId).pipe(
      tap((updatedTask) => {
        this.tasksSignal.update(tasks =>
          tasks.map(t => t.id === taskId ? updatedTask : t)
        );
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to assign user');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Unassign user from task and update signals
   */
  unassignUserWithSignal(taskId: string, userId: string): Observable<{ message: string }> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.unassignUser(taskId, userId).pipe(
      tap(() => {
        // Update the task in signals by removing the assignee
        this.tasksSignal.update(tasks =>
          tasks.map(task => {
            if (task.id === taskId) {
              return {
                ...task,
                assignees: task.assignees?.filter(assignee => assignee.id !== userId) || []
              };
            }
            return task;
          })
        );
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to unassign user');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // Filter Management Methods
  // ============================================

  /**
   * Set status filter
   */
  setStatusFilter(status: TaskStatus | null): void {
    this.statusFilterSignal.set(status);
  }

  /**
   * Set priority filter
   */
  setPriorityFilter(priority: TaskPriority | null): void {
    this.priorityFilterSignal.set(priority);
  }

  /**
   * Set assignee filter
   */
  setAssigneeFilter(assigneeId: string | null): void {
    this.assigneeFilterSignal.set(assigneeId);
  }

  /**
   * Set label filter
   */
  setLabelFilter(labelId: string | null): void {
    this.labelFilterSignal.set(labelId);
  }

  /**
   * Set search filter
   */
  setSearchFilter(search: string): void {
    this.searchFilterSignal.set(search);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.statusFilterSignal.set(null);
    this.priorityFilterSignal.set(null);
    this.assigneeFilterSignal.set(null);
    this.searchFilterSignal.set('');
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
    this.tasksSignal.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
    this.clearFilters();
  }

  getTasks(): Task[] {
  return this.tasksSignal();
}
}
