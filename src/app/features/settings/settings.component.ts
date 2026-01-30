import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProfileComponent } from './profile/profile.component';
import { PreferencesComponent } from './preferences/preferences.component';
import { SecurityComponent } from './security/security.component';
import { NotificationsComponent } from './notifications/notifications.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ProfileComponent,
    PreferencesComponent,
    SecurityComponent,
    NotificationsComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  activeTab: 'profile' | 'notifications' | 'appearance' | 'security' = 'profile';

  ngOnInit() {
    // Check for tab query parameter
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const tab = params['tab'];
      if (tab && ['profile', 'notifications', 'appearance', 'security'].includes(tab)) {
        this.activeTab = tab as 'profile' | 'notifications' | 'appearance' | 'security';
      }
    });
  }

  setActiveTab(tab: 'profile' | 'notifications' | 'appearance' | 'security') {
    this.activeTab = tab;
  }
}
