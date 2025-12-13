import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_CONFIG } from '../tokens/api-config.token';

@Injectable({
  providedIn: 'root',
})
export abstract class BaseService {
  protected readonly http = inject(HttpClient);
  protected readonly apiConfig = inject(API_CONFIG);

  protected get apiUrl(): string {
    return this.apiConfig.apiUrl;
  }

  protected buildUrl(endpoint: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.apiUrl}${cleanEndpoint}`;
  }
}
