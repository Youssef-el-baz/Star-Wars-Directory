// src/app/models/starship.model.ts
import type { SwapiStarship } from '../../types/swapi';

/**
 * App-level model for a Starship.
 *
 * It matches SWAPI's starship DTO, plus an `id` derived from the resource URL.
 * Having a stable `id` makes it easy to track rows and store client-only edits.
 */
export interface Starship extends SwapiStarship {
  id: string;
}

export function starshipIdFromUrl(url: string): string {
  // Example: https://swapi.dev/api/starships/9/ -> "9"
  const match = url.match(/\/api\/starships\/(\d+)\/?$/);
  return match?.[1] ?? url; // Fallback if SWAPI changes the URL format.
}

export function toStarship(dto: SwapiStarship): Starship {
  return {
    ...dto,
    id: starshipIdFromUrl(dto.url),
  };
}