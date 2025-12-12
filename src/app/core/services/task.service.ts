import { Injectable, signal, computed, DestroyRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, merge, switchMap, timer, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Task, TaskStatus, TaskPriority, Comment } from '../models/task.model';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);

  private apiUrl = '/api/tasks'; // Configure your API URL

  // BehaviorSubject for tasks
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  // Signals for reactive state
  private tasksSignal = signal<Task[]>([]);

  // Computed signals
  todoTasks = computed(() => this.tasksSignal().filter((task) => task.status === TaskStatus.TODO));

  doingTasks = computed(() =>
    this.tasksSignal().filter((task) => task.status === TaskStatus.DOING)
  );

  doneTasks = computed(() => this.tasksSignal().filter((task) => task.status === TaskStatus.DONE));

  urgentTasks = computed(() =>
    this.tasksSignal().filter((task) => task.priority === TaskPriority.URGENT)
  );

  constructor() {
    this.loadMockTasks();
    this.setupLiveUpdates();
  }

  private loadMockTasks(): void {
    // Mock data - Replace with actual API call
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Design Homepage',
        description: 'Create wireframes and mockups',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        assignedTo: ['user-1'],
        projectId: 'project-1',
        comments: [],
        dueDate: new Date('2025-12-20'),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
      },
      {
        id: '2',
        title: 'Implement Authentication',
        description: 'Add login and registration',
        status: TaskStatus.DOING,
        priority: TaskPriority.URGENT,
        assignedTo: ['user-2'],
        projectId: 'project-1',
        comments: [],
        dueDate: new Date('2025-12-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
      },
      {
        id: '3',
        title: 'Write Documentation',
        description: 'API documentation',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        assignedTo: ['user-3'],
        projectId: 'project-1',
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
      },
    ];

    this.tasksSignal.set(mockTasks);
    this.tasksSubject.next(mockTasks);
  }

  private setupLiveUpdates(): void {
    // Simulate live updates every 30 seconds
    const liveUpdates$ = timer(0, 30000).pipe(
      switchMap(() => this.fetchTasksFromAPI()),
      tap((tasks) => {
        this.tasksSignal.set(tasks);
        this.tasksSubject.next(tasks);
        this.logger.info('Tasks updated from server');
      }),
      catchError((error) => {
        this.logger.error('Error fetching tasks', error);
        return of([]);
      })
    );

    // Subscribe and auto-cleanup with DestroyRef
    liveUpdates$.subscribe();
  }

  private fetchTasksFromAPI(): Observable<Task[]> {
    // Replace with actual HTTP call
    return of(this.tasksSignal());
  }

  getTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  getTaskById(id: string): Observable<Task | undefined> {
    return this.tasks$.pipe(map((tasks) => tasks.find((task) => task.id === id)));
  }

  getTasksByProject(projectId: string): Observable<Task[]> {
    return this.tasks$.pipe(map((tasks) => tasks.filter((task) => task.projectId === projectId)));
  }

  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Observable<Task> {
    const newTask: Task = {
      ...task,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedTasks = [...this.tasksSignal(), newTask];
    this.tasksSignal.set(updatedTasks);
    this.tasksSubject.next(updatedTasks);

    this.logger.info('Task created', newTask);
    return of(newTask);
  }

  updateTask(id: string, updates: Partial<Task>): Observable<Task> {
    const tasks = this.tasksSignal();
    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) {
      throw new Error('Task not found');
    }

    const updatedTask = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date(),
    };

    const updatedTasks = [...tasks];
    updatedTasks[index] = updatedTask;

    this.tasksSignal.set(updatedTasks);
    this.tasksSubject.next(updatedTasks);

    this.logger.info('Task updated', updatedTask);
    return of(updatedTask);
  }

  deleteTask(id: string): Observable<void> {
    const updatedTasks = this.tasksSignal().filter((t) => t.id !== id);
    this.tasksSignal.set(updatedTasks);
    this.tasksSubject.next(updatedTasks);

    this.logger.info('Task deleted', id);
    return of(void 0);
  }

  moveTask(taskId: string, newStatus: TaskStatus): Observable<Task> {
    return this.updateTask(taskId, { status: newStatus });
  }

  addComment(
    taskId: string,
    content: string,
    userId: string,
    userName: string
  ): Observable<Comment> {
    const comment: Comment = {
      id: this.generateId(),
      taskId,
      userId,
      userName,
      content,
      createdAt: new Date(),
    };

    const tasks = this.tasksSignal();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    const updatedTask = {
      ...tasks[taskIndex],
      comments: [...tasks[taskIndex].comments, comment],
      updatedAt: new Date(),
    };

    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = updatedTask;

    this.tasksSignal.set(updatedTasks);
    this.tasksSubject.next(updatedTasks);

    return of(comment);
  }

  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
