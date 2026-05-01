import { Injectable } from '@angular/core';

/**
 * Simple in-memory cache.
 *
 * This intentionally stays client-side only so it can be replaced later
 * by a persistent store (IndexedDB) or server-side caching.
 */
@Injectable({ providedIn: 'root' })
export class CacheService {
  private cache = new Map<string, unknown>();

  get<T>(key: string): T | undefined {
    return this.cache.get(key) as T | undefined;
  }

  set<T>(key: string, value: T): void {
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
