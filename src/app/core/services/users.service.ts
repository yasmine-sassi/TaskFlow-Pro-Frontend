import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
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
}

@Injectable({
  providedIn: 'root',
})
export class UsersService extends BaseService {
  private logger = inject(LoggerService);
  
  // Only RxJS caching for data fetching
  private currentUserCache$: Observable<User> | null = null;
  private allUsersCache$: Observable<User[]> | null = null;

  /**
   * Get current user profile with caching
   */
  getProfile(): Observable<User> {
    if (!this.currentUserCache$) {
      this.logger.info('Fetching current user profile from API');
      this.currentUserCache$ = this.http
        .get<User>(this.buildUrl('/users/profile'))
        .pipe(
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
        .get<User[]>(this.buildUrl('/users'))
        .pipe(shareReplay(1));
    }
    return this.allUsersCache$;
  }

  updateProfile(dto: UpdateProfileDto): Observable<User> {
    return this.http
      .patch<User>(this.buildUrl('/users/profile'), dto)
      .pipe(
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
   * Clear cache (call on logout)
   */
  clearCache(): void {
    this.currentUserCache$ = null;
    this.allUsersCache$ = null;
  }
}