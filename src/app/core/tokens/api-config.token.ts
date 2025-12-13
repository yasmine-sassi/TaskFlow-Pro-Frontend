import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  apiUrl: string;
  timeout?: number;
  retryAttempts?: number;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('api.config', {
  providedIn: 'root',
  factory: () => ({
    apiUrl: 'http://localhost:3000/api', // Default value
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  }),
});
