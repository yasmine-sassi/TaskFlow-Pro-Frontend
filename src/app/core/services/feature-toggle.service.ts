import { Injectable, inject } from '@angular/core';
import { ENVIRONMENT } from '../tokens/environment.token';

@Injectable({
  providedIn: 'root',
})
export class FeatureToggleService {
  private readonly env = inject(ENVIRONMENT);

  /**
   * Check if a specific feature is enabled
   */
  isFeatureEnabled(feature: keyof NonNullable<typeof this.env.features>): boolean {
    return this.env.features?.[feature] ?? false;
  }

  /**
   * Check if logging is enabled
   */
  isLoggingEnabled(): boolean {
    return this.env.enableLogging ?? false;
  }

  /**
   * Check if debug tools are enabled
   */
  areDebugToolsEnabled(): boolean {
    return this.env.enableDebugTools ?? false;
  }

  /**
   * Get API timeout setting
   */
  getApiTimeout(): number {
    return this.env.apiTimeout ?? 30000;
  }

  /**
   * Get the API URL
   */
  getApiUrl(): string {
    return this.env.apiUrl;
  }
}
