import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TasksService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { Task, TaskStatus } from '../../core/models/task.model';
import { UserRole } from '../../core/models/user.model';
import { BOARD_COLUMNS } from './models/board.model';
import { TaskCardComponent } from '../tasks/task-card/task-card.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, TaskCardComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent implements OnInit {
  // Inject services
  private tasksService = inject(TasksService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  // Board columns configuration
  readonly columns = BOARD_COLUMNS;

  // Column drop list IDs for drag-drop connections
  readonly columnIds = computed(() => this.columns.map((col) => `column-${col.id}`));

  // Signals for state management
  selectedProjectId = signal<string>('all');
  dragOverColumn = signal<TaskStatus | null>(null);
  draggingTaskId = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  myTasks = signal<Task[]>([]);

  // Computed signals
  readonly currentUser = this.authService.currentUserSignal;
  readonly isAdmin = computed(() => this.currentUser()?.role === UserRole.ADMIN);

  // Get unique projects from tasks
  userProjects = computed<{ id: string; name: string }[]>(() => {
    const tasks = this.myTasks();

    // filter tasks with projectId, then create Map for uniqueness
    const projectMap = new Map(
      tasks
        .filter((task) => task.projectId)
        .map((task) => [
          task.projectId,
          {
            id: task.projectId,
            name: (task as any).project?.name || `Project ${task.projectId.substring(0, 8)}`,
          },
        ]),
    );

    return Array.from(projectMap.values());
  });

  // Filter tasks by selected project
  filteredTasks = computed(() => {
    const projectId = this.selectedProjectId();
    const tasks = this.myTasks();

    if (projectId === 'all') {
      return tasks;
    }

    return tasks.filter((task) => task.projectId === projectId);
  });

  // Check if admin (admin can't drag/drop)
  canDragDrop = computed(() => !this.isAdmin());

  // Group tasks by status
  tasksByStatus = computed(() => {
    const tasks = this.filteredTasks();
    const grouped: Record<TaskStatus, Task[]> = {
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.IN_REVIEW]: [],
      [TaskStatus.DONE]: [],
    };

    // Group tasks by status
    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  });

  onDragEnd() {
    this.dragOverColumn.set(null);
    this.draggingTaskId.set(null);
  }

  onDragOver(status: TaskStatus) {
    this.dragOverColumn.set(status);
  }

  onDragLeave() {
    this.dragOverColumn.set(null);
  }

  onDrop(event: CdkDragDrop<Task[]>, targetStatus: TaskStatus) {
    this.dragOverColumn.set(null);

    const task = event.item.data as Task;

    // If task status changed, update it on the backend and locally
    if (task.status !== targetStatus) {
      this.updateTaskStatus(task, targetStatus);
    }
  }

  private updateTaskStatus(task: Task, newStatus: TaskStatus) {
    this.tasksService
      .updateTask(task.id, { status: newStatus })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Update the task in the local array
          const tasks = [...this.myTasks()];
          const index = tasks.findIndex((t) => t.id === task.id);
          if (index !== -1) {
            tasks[index] = { ...tasks[index], status: newStatus };
            this.myTasks.set(tasks);
          }
          // Optionally show a toast notification
        },
        error: () => {
          // Optionally show error notification
        },
      });
  }

  // Project filter handler
  onProjectFilterChange(projectId: string) {
    this.selectedProjectId.set(projectId);
  }

  // Lifecycle
  ngOnInit() {
    // Load tasks for the current user
    const userId = this.currentUser()?.id;
    if (userId) {
      this.loadTasks();
    }
  }

  private loadTasks() {
    this.isLoading.set(true);

    const isAdminUser = this.isAdmin();
    const taskRequest = isAdminUser
      ? this.tasksService.getAllTasks()
      : this.tasksService.getMyTasks();

    taskRequest.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (tasks) => {
        this.myTasks.set(tasks);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}
