import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { shareReplay, map, switchMap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { BaseService } from './base.service';
import { LoggerService } from './logger.service';

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService extends BaseService {
  private logger = inject(LoggerService);
  
  // Only RxJS caching for data fetching
  private currentUserCache$: Observable<User> | null = null;
  private allUsersCache$: Observable<User[]> | null = null;
  private assignableUsersCache = new Map<string, Observable<User[]>>();
  
  currentUserSignal = signal<User | null>(null);
  /**
   * Get current user profile with caching
   */
  getProfile(): Observable<User> {
    if (!this.currentUserCache$) {
      this.logger.info('Fetching current user profile from API');
      this.currentUserCache$ = this.http
        .get<{ data: User }>(this.buildUrl('/users/profile'))
        .pipe(
          map(response => response.data),
          tap(() => this.logger.info('Current user profile cached')),
          shareReplay(1),
          catchError((error) => {
            this.currentUserCache$ = null; // Invalidate on error
            return throwError(() => error);
          })
        );
    }
    return this.currentUserCache$;
  }

  getAllUsers(): Observable<User[]> {
    if (!this.allUsersCache$) {
      this.allUsersCache$ = this.http
        .get<{ data: User[] }>(this.buildUrl('/users'))
        .pipe(
          map(response => response.data),
          shareReplay(1)
        );
    }
    return this.allUsersCache$;
  }

  /**
   * Get users assignable to a specific project (admin or project owner)
   */
  getAssignableUsers(projectId: string): Observable<User[]> {
    if (!projectId || projectId.trim() === '') {
      return this.getAllUsers();
    }
    if (!this.assignableUsersCache.has(projectId)) {
      const req$ = this.http
        .get<any>(this.buildUrl(`/projects/${projectId}/assignable-users`))
        .pipe(
          switchMap((res) => {
            const list = Array.isArray(res?.data)
              ? res.data
              : Array.isArray(res)
                ? res
                : [];

            const normalized = list
              .map((u: any) => ({ ...u, id: u?.id ?? u?.userId ?? '' }))
              .filter((u: any) => !!u.id);

            const hasUserDetails = normalized.some(
              (u: any) => u.firstName || u.lastName || u.email
            );

            if (hasUserDetails) {
              return of(this.dedupeById(normalized));
            }

            if (normalized.length === 0) {
              return of([] as User[]);
            }

            // Fallback: fetch all users and filter by returned ids
            const ids = new Set(normalized.map((u: any) => u.id));
            return this.getAllUsers().pipe(
              map((all) => all.filter((u) => ids.has(u.id)))
            );
          }),
          map(users => this.dedupeById(users)),
          shareReplay(1),
          catchError((err) => {
            // Invalidate cache entry on error
            this.assignableUsersCache.delete(projectId);
            return throwError(() => err);
          })
        );
      this.assignableUsersCache.set(projectId, req$);
    }
    return this.assignableUsersCache.get(projectId)!;
  }

  private dedupeById(users: User[]): User[] {
    const mapById = new Map<string, User>();
    users.forEach((u) => {
      if (u.id) mapById.set(u.id, u);
    });
    return Array.from(mapById.values());
  }

  updateProfile(dto: UpdateProfileDto): Observable<User> {
    return this.http
      .patch<{ data: User }>(this.buildUrl('/users/profile'), dto)
      .pipe(
        map(response => response.data),
        tap(() => {
          // Invalidate cache on update
          this.currentUserCache$ = null;
          this.allUsersCache$ = null;
        })
      );
  }

  changePassword(dto: ChangePasswordDto): Observable<void> {
    return this.http.post<void>(
      this.buildUrl('/users/change-password'),
      dto
    );
  }

  deleteAccount(): Observable<void> {
    return this.http.delete<void>(this.buildUrl('/users/profile')).pipe(
      tap(() => {
        this.currentUserCache$ = null;
        this.allUsersCache$ = null;
      })
    );
  }
  /**
 * Delete a user (admin only)
 * @param id - User ID to delete
 * @returns Observable that completes when user is deleted
 */
deleteUser(id: string): Observable<{ message: string }> {
  return this.http.delete<{ message: string }>(this.buildUrl(`/users/${id}`)).pipe(
    tap(() => {
      // Invalidate caches when a user is deleted
      this.allUsersCache$ = null;
      this.assignableUsersCache.clear();
      this.logger.info(`User ${id} deleted, caches invalidated`);
    }),
    catchError((error) => {
      this.logger.error('Error deleting user:', error);
      return throwError(() => error);
    })
  );
}

  /**
   * Clear cache (call on logout)
   */
  clearCache(): void {
    this.currentUserCache$ = null;
    this.allUsersCache$ = null;
    this.assignableUsersCache.clear();
  }
}
