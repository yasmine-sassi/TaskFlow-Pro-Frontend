import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FormStateService {
  save<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to persist form state:', error);
    }
  }

  restore<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn('Failed to restore form state:', error);
      return null;
    }
  }

  clear(key: string): void {
    localStorage.removeItem(key);
  }
}
