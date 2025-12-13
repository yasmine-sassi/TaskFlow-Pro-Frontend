import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { BaseService } from './base.service';

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
}
