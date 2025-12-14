import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
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

  // Signals for state management
  usersSignal = signal<User[]>([]);
  currentUserSignal = signal<User | null>(null);
  loadingSignal = signal<boolean>(false);
  errorSignal = signal<string | null>(null);

  // Computed properties for user-related queries
  allUsers = computed(() => this.usersSignal());
  activeUsers = computed(() => this.usersSignal().filter(user => user.isActive));
  adminUsers = computed(() => this.usersSignal().filter(user => user.role === 'ADMIN'));
  regularUsers = computed(() => this.usersSignal().filter(user => user.role === 'USER'));
  availableUsersForProject = computed(() => {
    // Users that can be added to projects (active, non-admin users)
    return this.usersSignal().filter(user => user.isActive && user.role === 'USER');
  });

  // Search and filter computed properties
  usersBySearch = (searchTerm: string) => computed(() =>
    this.usersSignal().filter(user =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  constructor() {
    super();
    // Effects for side effects
    effect(() => {
      const users = this.usersSignal();
      this.logger.info(`Users updated: ${users.length} users loaded`);
    });

    effect(() => {
      const user = this.currentUserSignal();
      if (user) {
        this.logger.info(`Current user: ${user.firstName} ${user.lastName} (${user.email})`);
      }
    });

    effect(() => {
      const error = this.errorSignal();
      if (error) {
        this.logger.error(`Users error: ${error}`);
      }
    });
  }
  /**
   * Get all users (Admin only)
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.buildUrl('/users'));
  }

  /**
   * Get current user profile
   */
  getProfile(): Observable<User> {
    return this.http.get<User>(this.buildUrl('/users/profile'));
  }

  /**
   * Update current user profile
   */
  updateProfile(dto: UpdateProfileDto): Observable<User> {
    return this.http.patch<User>(this.buildUrl('/users/profile'), dto);
  }

  /**
   * Change password
   */
  changePassword(dto: ChangePasswordDto): Observable<void> {
    return this.http.post<void>(this.buildUrl('/users/change-password'), dto);
  }

  /**
   * Delete account
   */
  deleteAccount(): Observable<void> {
    return this.http.delete<void>(this.buildUrl('/users/profile'));
  }

  // ============================================
  // Signal-Based State Management Methods
  // ============================================

  /**
   * Load all users and update signals
   */
  loadAllUsers(): Observable<User[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.getAllUsers().pipe(
      tap((users) => {
        this.usersSignal.set(users);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to load users');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Load current user profile and update signals
   */
  loadCurrentUser(): Observable<User> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.getProfile().pipe(
      tap((user) => {
        this.currentUserSignal.set(user);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to load current user');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update current user profile and update signals
   */
  updateProfileWithSignal(dto: UpdateProfileDto): Observable<User> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.updateProfile(dto).pipe(
      tap((updatedUser) => {
        this.currentUserSignal.set(updatedUser);
        // Also update in usersSignal if present
        this.usersSignal.update(users =>
          users.map(user => user.id === updatedUser.id ? updatedUser : user)
        );
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to update profile');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Change password (no signal update needed)
   */
  changePasswordWithSignal(dto: ChangePasswordDto): Observable<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.changePassword(dto).pipe(
      tap(() => {
        this.loadingSignal.set(false);
        this.logger.info('Password changed successfully');
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to change password');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete account and clear signals
   */
  deleteAccountWithSignal(): Observable<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.deleteAccount().pipe(
      tap(() => {
        // Clear user data
        this.currentUserSignal.set(null);
        this.loadingSignal.set(false);
        this.logger.info('Account deleted successfully');
      }),
      catchError((error) => {
        this.errorSignal.set(error.message || 'Failed to delete account');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get user by ID from current users signal
   */
  getUserById(userId: string): User | undefined {
    return this.usersSignal().find(user => user.id === userId);
  }

  /**
   * Check if user is available for project assignment
   */
  isUserAvailableForProject(userId: string): boolean {
    const user = this.getUserById(userId);
    return user ? user.isActive && user.role === 'USER' : false;
  }

  /**
   * Get users available for task assignment in a project
   */
  getAvailableUsersForTask(projectId?: string): User[] {
    // For now, return all active regular users
    // In a more complex implementation, this could filter by project membership
    return this.availableUsersForProject();
  }

  /**
   * Search users by name or email
   */
  searchUsers(query: string): User[] {
    if (!query.trim()) {
      return this.usersSignal();
    }

    const lowerQuery = query.toLowerCase();
    return this.usersSignal().filter(user =>
      user.firstName.toLowerCase().includes(lowerQuery) ||
      user.lastName.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery)
    );
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
    this.usersSignal.set([]);
    this.currentUserSignal.set(null);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}
