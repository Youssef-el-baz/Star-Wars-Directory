import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import type { SwapiListResponse, SwapiStarship } from '../../types/swapi';
import { toStarship, type Starship } from '../models/starship.model';

export function nextPageFromNextUrl(nextUrl: string | null): number | null {
  if (!nextUrl) return null;
  try {
    const url = new URL(nextUrl);
    const page = url.searchParams.get('page');
    return page ? Number(page) : null;
  } catch {
    return null;
  }
}

export function mergeStarshipPages(pages: Array<SwapiListResponse<Starship>>): Starship[] {
  return pages.flatMap((p) => p.results);
}

@Injectable({ providedIn: 'root' })
export class SwapiService {
  private readonly baseUrl = 'https://swapi.dev/api';

  // Page cache to avoid re-fetching already loaded pages.
  private readonly pageCache = new Map<number, SwapiListResponse<Starship>>();

  // In-flight de-dupe so multiple callers asking for the same page share 1 request.
  private readonly inFlight = new Map<number, Promise<SwapiListResponse<Starship>>>();

  private readonly pageSubject = new Subject<{ page: number; data: SwapiListResponse<Starship> }>();
  readonly page$ = this.pageSubject.asObservable();

  private readonly errorSubject = new Subject<{ page: number; error: unknown }>();
  readonly error$ = this.errorSubject.asObservable();

  clearCache(): void {
    this.pageCache.clear();
    this.inFlight.clear();
  }

  hasCachedPage(page: number): boolean {
    return this.pageCache.has(page);
  }

  /**
   * Fetch a SWAPI starships page.
   *
   * This is intentionally implemented with `fetch()` (no extra HTTP libraries) and kept read-only.
   * Returned pages are cached in-memory for the lifetime of the session.
   */
  async getStarships(page: number): Promise<SwapiListResponse<Starship>> {
    const cached = this.pageCache.get(page);
    if (cached) return cached;

    const inflight = this.inFlight.get(page);
    if (inflight) return inflight;

    const promise = this.fetchStarshipsPage(page)
      .then((data) => {
        this.pageCache.set(page, data);
        return data;
      })
      .finally(() => {
        this.inFlight.delete(page);
      });

    this.inFlight.set(page, promise);
    return promise;
  }

  /**
   * Convenience method: loads a page and emits on page$/error$.
   * Useful for components that want a stream of page events.
   */
  async loadStarshipsPage(page: number): Promise<void> {
    try {
      const data = await this.getStarships(page);
      this.pageSubject.next({ page, data });
    } catch (error) {
      this.errorSubject.next({ page, error });
    }
  }

  private async fetchStarshipsPage(page: number): Promise<SwapiListResponse<Starship>> {
    const url = `${this.baseUrl}/starships/?page=${page}`;

    // Note: SWAPI is read-only. We only use GET.
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`SWAPI error ${res.status} ${res.statusText}`);
    }

    const data: SwapiListResponse<SwapiStarship> = await res.json();

    return {
      ...data,
      results: data.results.map(toStarship),
    };
  }
}
