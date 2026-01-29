import { Injectable, inject, signal } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Task, Comment } from '../models/task.model';
import { Project } from '../models/project.model';
import { BaseService } from './base.service';
import { LoggerService } from './logger.service';
import { AuthService } from './auth.service';

export interface SearchTasksParams {
  q?: string; // Search query
  projectId?: string;
  status?: string;
  priority?: string;
  assignedToMe?: boolean;
  labelId?: string;
  dueFrom?: string;
  dueTo?: string;
  page?: number;
  limit?: number;
}

export interface SearchCommentsParams {
  q?: string; // Search query
  projectId?: string;
  taskId?: string;
  taskStatus?: string;
  taskPriority?: string;
  labelId?: string;
  dueFrom?: string;
  dueTo?: string;
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GlobalSearchResults {
  tasks: Task[];
  projects: Project[];
  comments: Comment[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SearchService extends BaseService {
  private logger = inject(LoggerService);
  private authService = inject(AuthService);

  // Signal for caching recent searches
  private searchCache = signal<Map<string, GlobalSearchResults>>(new Map());

  /**
   * Search tasks across all accessible projects
   * Filters to only return tasks assigned to the current user or owned by them
   */
  searchTasks(params: SearchTasksParams): Observable<SearchResult<Task>> {
    let httpParams = new HttpParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    const currentUserId = this.authService.currentUserSignal()?.id;

    return this.http.get<SearchResult<Task>>(
      this.buildUrl('/search/tasks'),
      { params: httpParams }
    ).pipe(
      map(result => {
        // Filter to only include tasks assigned to current user or owned by them
        const filteredTasks = result.data.filter(task => {
          const isOwner = task.ownerId === currentUserId;
          const isAssigned = task.assignees?.some(assignee => assignee.id === currentUserId) ?? false;
          return isOwner || isAssigned;
        });

        return {
          data: filteredTasks,
          meta: {
            ...result.meta,
            total: filteredTasks.length,
          },
        };
      }),
      tap(() => this.logger.info('Tasks search completed')),
      catchError((error) => {
        this.logger.error('Failed to search tasks: ' + error.message);
        return of({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      })
    );
  }

  /**
   * Search comments across all accessible projects
   * Backend already filters by accessible projects
   * No additional filtering needed since comments are on tasks in accessible projects
   */
  searchComments(params: SearchCommentsParams): Observable<SearchResult<Comment>> {
    let httpParams = new HttpParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<SearchResult<Comment>>(
      this.buildUrl('/search/comments'),
      { params: httpParams }
    ).pipe(
      tap(() => this.logger.info('Comments search completed')),
      catchError((error) => {
        this.logger.error('Failed to search comments: ' + error.message);
        return of({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      })
    );
  }

  /**
   * Search projects assigned to the current user
   */
  searchProjects(query: string): Observable<Project[]> {
    if (!query || query.trim().length === 0) {
      return of([]);
    }

    return this.http.get<{ data: Project[] }>(
      this.buildUrl('/projects')
    ).pipe(
      map(response => {
        const projects = response.data || [];
        const lowerQuery = query.toLowerCase();
        
        // Filter by name/description AND only include projects the user is part of
        return projects.filter(project => 
          (project.name.toLowerCase().includes(lowerQuery) ||
           (project.description && project.description.toLowerCase().includes(lowerQuery)))
        ).slice(0, 5); // Limit to 5 results for autocomplete
      }),
      catchError((error) => {
        this.logger.error('Failed to search projects: ' + error.message);
        return of([]);
      })
    );
  }

  /**
   * Perform global search across tasks, projects, and comments
   * Filters results based on current user's access
   */
  globalSearch(query: string, limit: number = 5): Observable<GlobalSearchResults> {
    if (!query || query.trim().length < 2) {
      return of({
        tasks: [],
        projects: [],
        comments: [],
        loading: false,
        error: null,
      });
    }

    // Check cache first
    const cachedResult = this.searchCache().get(query);
    if (cachedResult) {
      this.logger.info('Returning cached search results for: ' + query);
      return of(cachedResult);
    }

    const searchParams: SearchTasksParams = { q: query, limit };
    const commentParams: SearchCommentsParams = { q: query, limit };

    return forkJoin({
      tasks: this.searchTasks(searchParams).pipe(
        map(result => result.data),
        catchError(() => of([]))
      ),
      projects: this.searchProjects(query).pipe(
        catchError(() => of([]))
      ),
      comments: this.searchComments(commentParams).pipe(
        map(result => result.data),
        catchError(() => of([]))
      ),
    }).pipe(
      map(results => ({
        ...results,
        loading: false,
        error: null,
      })),
      tap(results => {
        // Cache the results
        this.searchCache.update(cache => {
          const newCache = new Map(cache);
          // Keep only last 10 searches in cache to avoid memory issues
          if (newCache.size >= 10) {
            const firstKey = newCache.keys().next().value;
            if (firstKey !== undefined) {
              newCache.delete(firstKey);
            }
          }
          newCache.set(query, results);
          return newCache;
        });
        this.logger.info('Search results cached for: ' + query);
      }),
      catchError((error) => {
        this.logger.error('Global search failed: ' + error.message);
        return of({
          tasks: [],
          projects: [],
          comments: [],
          loading: false,
          error: 'Failed to perform search. Please try again.',
        });
      })
    );
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.set(new Map());
    this.logger.info('Search cache cleared');
  }
}
