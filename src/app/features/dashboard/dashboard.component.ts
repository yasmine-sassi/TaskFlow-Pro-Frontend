// features/dashboard/dashboard.component.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { TasksService } from '../../core/services/task.service';
import { ProjectsService } from '../../core/services/projects.service';
import { Task, TaskStatus, TaskPriority } from '../../core/models/task.model';
import { Project } from '../../core/models/project.model';
import { TaskCardComponent } from '../tasks/task-card/task-card.component';

interface DashboardStats {
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  overdueCount: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TaskCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private tasksService = inject(TasksService);
  private projectsService = inject(ProjectsService);

  // Signals
  isLoading = signal(true);
  stats = signal<DashboardStats>({
    todoCount: 0,
    inProgressCount: 0,
    doneCount: 0,
    overdueCount: 0
  });
  recentTasks = signal<Task[]>([]);
  highPriorityTasks = signal<Task[]>([]);
  projects = signal<Project[]>([]);
  selectedTask = signal<Task | null>(null);
  error = signal<string | null>(null);

  // Computed - Use currentUserSignal from your AuthService
  user = this.authService.currentUserSignal;
  firstName = computed(() => {
    const user = this.user();
    if (!user) return 'User';
    return user.firstName || user.email?.split('@')[0] || 'User';
  });

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    this.isLoading.set(true);
    this.error.set(null);

    // Use forkJoin to load all data in parallel
    forkJoin({
      projects: this.projectsService.getAllProjects(),
      tasks: this.tasksService.getMyTasks().pipe(
        catchError(error => {
          console.error('Error loading tasks:', error);
          // Return empty tasks array
          return [{ data: [] }];
        })
      )
    }).pipe(
      map(({ projects, tasks }) => {
        // Debug logs
        console.log('Raw projects response:', projects);
        console.log('Raw tasks response:', tasks);

        // Handle tasks response - it might be { data: Task[], meta: {} }
        let tasksArray: Task[] = [];
        if (Array.isArray(tasks)) {
          tasksArray = tasks;
        } else if (tasks && typeof tasks === 'object' && 'data' in tasks) {
          tasksArray = (tasks as any).data || [];
        }

        // Handle projects response - should be Project[] directly
        let projectsArray: Project[] = [];
        if (Array.isArray(projects)) {
          projectsArray = projects;
        } else if (projects && typeof projects === 'object') {
          // Try to handle unexpected formats
          projectsArray = Object.values(projects);
        }

        console.log('Processed tasks:', tasksArray);
        console.log('Processed projects:', projectsArray);

        // Calculate stats
        const stats = this.calculateStats(tasksArray);
        
        // Get recent tasks (last 5 updated)
        const recent = [...tasksArray]
          .sort((a, b) => 
            new Date(b.updatedAt || b.createdAt || 0).getTime() - 
            new Date(a.updatedAt || a.createdAt || 0).getTime()
          )
          .slice(0, 5);
        
        // Get high priority incomplete tasks
        const highPriority = tasksArray
          .filter(t => {
            const isHighPriority = t.priority === TaskPriority.HIGH || t.priority === TaskPriority.URGENT;
            const isNotDone = t.status !== TaskStatus.DONE;
            return isHighPriority && isNotDone;
          })
          .slice(0, 3);

        return { stats, recent, highPriority, projects: projectsArray };
      }),
      catchError(error => {
        console.error('Dashboard load error:', error);
        this.error.set('Failed to load dashboard data');
        return [{
          stats: { todoCount: 0, inProgressCount: 0, doneCount: 0, overdueCount: 0 },
          recent: [],
          highPriority: [],
          projects: []
        }];
      })
    ).subscribe({
      next: (data) => {
        console.log('Dashboard data loaded:', data);
        this.stats.set(data.stats);
        this.recentTasks.set(data.recent);
        this.highPriorityTasks.set(data.highPriority);
        this.projects.set(data.projects);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Subscription error:', error);
        this.error.set('An unexpected error occurred');
        this.isLoading.set(false);
      }
    });
  }

  private calculateStats(tasks: Task[]): DashboardStats {
    if (!tasks || !Array.isArray(tasks)) {
      return { todoCount: 0, inProgressCount: 0, doneCount: 0, overdueCount: 0 };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return {
      todoCount: tasks.filter(t => t.status === TaskStatus.TODO).length,
      inProgressCount: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      doneCount: tasks.filter(t => t.status === TaskStatus.DONE).length,
      overdueCount: tasks.filter(t => {
        if (t.status === TaskStatus.DONE || !t.dueDate) return false;
        
        try {
          const dueDate = new Date(t.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < now && !this.isToday(dueDate);
        } catch {
          return false;
        }
      }).length
    };
  }

  private isToday(date: Date): boolean {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      
      return date.getTime() === today.getTime();
    } catch {
      return false;
    }
  }

  getProjectTaskCount(projectId: string): number {
    // Count tasks from recent and high priority lists
    const allTasks = [...this.recentTasks(), ...this.highPriorityTasks()];
    
    // Use a Set to avoid counting duplicates
    const uniqueTasks = new Map();
    allTasks.forEach(task => {
      if (!uniqueTasks.has(task.id)) {
        uniqueTasks.set(task.id, task);
      }
    });
    
    return Array.from(uniqueTasks.values())
      .filter(task => task.projectId === projectId)
      .length;
  }

  openTaskModal(task: Task) {
    this.selectedTask.set(task);
  }

  closeTaskModal() {
    this.selectedTask.set(null);
  }
}