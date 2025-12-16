import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import {
  LucideAngularModule,
  FileText,
  Home,
  ChevronRight,
  Search,
  Bell,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  FolderOpen,
  ListTodo,
  Kanban,
  Shield,
  CheckSquare,
  ChevronLeft,
  MessageSquare,
  Calendar,
  UserPlus,
  Check,
  CheckCheck,
  BellOff,
  X,
  Edit,
  CheckCircle,
} from 'lucide-angular';

// Import interceptors
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { loggingInterceptor } from './core/interceptors/logging.interceptor';
import { environment } from '../environments/environment';

import { API_CONFIG, ApiConfig } from './core/tokens/api-config.token';
import { ENVIRONMENT } from './core/tokens/environment.token';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        loggingInterceptor, // First - log all requests
        authInterceptor, // Second - add auth token
        loadingInterceptor, // Third - show loading
        errorInterceptor, // Last - handle errors
      ])
    ),
    importProvidersFrom(
      LucideAngularModule.pick({
        FileText,
        Home,
        ChevronRight,
        Search,
        Bell,
        User,
        Settings,
        HelpCircle,
        LogOut,
        ChevronDown,
        LayoutDashboard,
        FolderOpen,
        ListTodo,
        Kanban,
        Shield,
        CheckSquare,
        ChevronLeft,
        MessageSquare,
        Calendar,
        UserPlus,
        Check,
        CheckCheck,
        BellOff,
        X,
        Edit,
        CheckCircle,
      })
    ),
    {
      provide: API_CONFIG,
      useValue: {
        apiUrl: environment.apiUrl,
        timeout: 30000,
        retryAttempts: 3,
      } as ApiConfig,
    },
    {
      provide: ENVIRONMENT,
      useValue: environment,
    },
  ],
};
