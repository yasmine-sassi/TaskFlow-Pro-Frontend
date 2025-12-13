import { InjectionToken } from '@angular/core';

export interface EnvironmentConfig {
  production: boolean;
  apiUrl: string;
  apiTimeout?: number;
  enableLogging?: boolean;
  enableDebugTools?: boolean;
  features?: {
    notifications?: boolean;
    analytics?: boolean;
    darkMode?: boolean;
  };
}

export const ENVIRONMENT = new InjectionToken<EnvironmentConfig>('environment');
