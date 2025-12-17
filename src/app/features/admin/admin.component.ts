import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private router = inject(Router);

  // Signals for reactive state
  users = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Use computed signals from AuthService
  isAdmin = this.authService.isAdmin;
  currentUser = this.authService.currentUserSignal;

  // Computed stats
  totalUsers = computed(() => this.users().length);
  activeUsers = computed(() => 
    this.users().filter(u => u.isActive !== false).length
  );
  administrators = computed(() => 
    this.users().filter(u => u.role === 'ADMIN').length
  );

  ngOnInit(): void {
    // Check if user is admin
    if (!this.isAdmin()) {
      console.warn('Access denied: User is not an admin');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.usersService.getAllUsers().subscribe({
      next: (users) => {
        console.log('Loaded users:', users);
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.error.set('Failed to load users. Please try again.');
        this.loading.set(false);
      }
    });
  }

  getInitials(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user.email.charAt(0).toUpperCase();
  }

  getUserDisplayName(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  }

  getUserAvatar(user: User): string {
    return user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
  }

  getUserStatus(user: User): 'active' | 'inactive' {
    return user.isActive !== false ? 'active' : 'inactive';
  }

  getLastActive(user: User): string {
    if (user.createdAt) {
      return new Date(user.createdAt).toLocaleDateString();
    }
    return 'Never';
  }

  refreshUsers(): void {
    // Clear cache and reload
    this.usersService.clearCache();
    this.loadUsers();
  }

  deleteUser(user: User): void {
    // Prevent deleting yourself
    if (user.id === this.currentUser()?.id) {
      alert('You cannot delete your own account from the admin panel.');
      return;
    }

    const userName = this.getUserDisplayName(user);
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    // Optimistically remove from UI
    const originalUsers = this.users();
    this.users.update(users => users.filter(u => u.id !== user.id));

    this.usersService.deleteUser(user.id).subscribe({
      next: () => {
        console.log('User deleted successfully:', user.id);
        // Clear cache to ensure fresh data on next load
        this.usersService.clearCache();
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        // Restore the original list on error
        this.users.set(originalUsers);
        alert('Failed to delete user. Please try again.');
      }
    });
  }

  isDeletable(user: User): boolean {
    // Can't delete yourself
    return user.id !== this.currentUser()?.id;
  }
}