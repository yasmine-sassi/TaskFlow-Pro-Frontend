import { EnvironmentConfig } from '../app/core/tokens/environment.token';

export const environment: EnvironmentConfig = {
  production: false,
  apiUrl: 'http://localhost:3000',
  apiTimeout: 30000,
  enableLogging: true,
  enableDebugTools: true,
  features: {
    notifications: true,
    analytics: false,
    darkMode: true,
  },
};
