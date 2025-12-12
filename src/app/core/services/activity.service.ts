import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, merge, of } from 'rxjs';
import { Activity, ActivityType } from '../models/activity.model';

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private activitiesSubject = new BehaviorSubject<Activity[]>([]);
  public activities$ = this.activitiesSubject.asObservable();

  private activitiesSignal = signal<Activity[]>([]);

  constructor() {
    this.loadMockActivities();
  }

  private loadMockActivities(): void {
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: ActivityType.TASK_CREATED,
        userId: 'user-1',
        userName: 'John Doe',
        taskId: '1',
        taskTitle: 'Design Homepage',
        details: 'Created new task "Design Homepage"',
        timestamp: new Date(),
      },
    ];

    this.activitiesSignal.set(mockActivities);
    this.activitiesSubject.next(mockActivities);
  }

  logActivity(activity: Omit<Activity, 'id' | 'timestamp'>): void {
    const newActivity: Activity = {
      ...activity,
      id: this.generateId(),
      timestamp: new Date(),
    };

    const updated = [newActivity, ...this.activitiesSignal()];
    this.activitiesSignal.set(updated);
    this.activitiesSubject.next(updated);
  }

  getRecentActivities(limit: number = 10): Observable<Activity[]> {
    return of(this.activitiesSignal().slice(0, limit));
  }

  private generateId(): string {
    return `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
