// auth.service.ts - FIXED version with proper public refreshCurrentUser method
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, UserRole, AuthResponse, LoginDto, RegisterDto } from '../models/user.model';
import { BaseService } from './base.service';
import { WebSocketService } from './websocket.service';
import { ProjectsService } from './projects.service';
import { LabelsService } from './labels.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService extends BaseService {
  private router = inject(Router);
  private webSocketService = inject(WebSocketService);
  private projectsService = inject(ProjectsService);
  private labelsService = inject(LabelsService);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Signal-based state
  currentUserSignal = signal<User | null>(null);
  isAdmin = computed(() => this.currentUserSignal()?.role === UserRole.ADMIN);

  isAuthenticated(): boolean {
    const isAuth = this.currentUserSignal() !== null;
    console.log('isAuthenticated check:', { isAuth, user: this.currentUserSignal() });
    return isAuth;
  }

  constructor() {
    super();
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');
    console.log('Loading user from storage:', { userJson: !!userJson });
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        console.log('Setting current user from storage:', user);
        this.updateCurrentUser(user);
        // Reconnect WebSocket if user is loaded from storage
        this.webSocketService.reconnect();
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('currentUser');
        console.log('Cleared corrupted user data from localStorage');
      }
    } else {
      console.log('No user data in storage');
    }
  }

  /**
   * Register a new user
   */
  register(dto: RegisterDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.buildUrl('/auth/register'), dto, { withCredentials: true })
      .pipe(
        tap((response) => {
          this.handleAuthSuccess(response);
        })
      );
  }

  /**
   * Login with email and password
   */
  login(email: string, password: string): Observable<AuthResponse> {
    const loginDto: LoginDto = { email, password };
    return this.http
      .post<AuthResponse>(this.buildUrl('/auth/login'), loginDto, { withCredentials: true })
      .pipe(
        tap((response) => {
          this.handleAuthSuccess(response);
        })
      );
  }

  /**
   * Get current user profile from server
   */
  me(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(this.buildUrl('/auth/me'), { withCredentials: true }).pipe(
      tap((response) => {
        this.updateCurrentUser(response.user);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(this.buildUrl('/auth/logout'), {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.clearAuthData();
          this.router.navigate(['/auth/login']);
        })
      );
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(response: AuthResponse): void {
    // Store token in localStorage for WebSocket authentication
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    // Store user data
    this.updateCurrentUser(response.user);

    // Reconnect WebSocket with new authentication
    this.webSocketService.reconnect();
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    // Token is cleared via httpOnly cookie by backend
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.currentUserSignal.set(null);
    this.projectsService.clearState();
    this.labelsService.clearState();
  }

  /**
   * Update current user in state and storage (internal use)
   */
  private updateCurrentUser(user: User): void {
    console.log('Updating current user:', user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.currentUserSignal.set(user);
    console.log('Current user signal set to:', this.currentUserSignal());
  }

  /**
   * Refresh current user (used after profile updates)
   * This is the public method that components should call
   */
  refreshCurrentUser(user: User): void {
    console.log('Refreshing current user:', user);
    this.updateCurrentUser(user);
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Set JWT token in storage
   */
  private setToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  /**
   * Get current user from state
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }
}