import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, UserRole, AuthResponse, LoginDto, RegisterDto } from '../models/user.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService extends BaseService {
  private router = inject(Router);

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
      const user = JSON.parse(userJson);
      console.log('Setting current user from storage:', user);
      this.setCurrentUser(user);
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
        this.setCurrentUser(response.user);
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
    // Token is stored in httpOnly cookie by backend
    // Just store user data
    this.setCurrentUser(response.user);
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    // Token is cleared via httpOnly cookie by backend
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.currentUserSignal.set(null);
  }

  /**
   * Set current user in state and storage
   */
  private setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.currentUserSignal.set(user);
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
