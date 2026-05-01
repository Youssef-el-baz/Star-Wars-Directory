import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

import type { Starship } from '../../models/starship.model';
import { SwapiService } from '../../services/swapi.service';

type ColumnKey =
  | 'name'
  | 'model'
  | 'manufacturer'
  | 'crew'
  | 'passengers'
  | 'hyperdrive_rating'
  | 'starship_class'
  | 'MGLT';

type EditingCell = {
  id: string;
  field: 'crew';
  draft: string;
};

@Component({
  selector: 'app-starship-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './starship-grid.component.html',
  styleUrl: './starship-grid.component.css',
})
export class StarshipGridComponent implements OnInit {
  @Input() searchTerm = '';

  readonly columns: Array<{ key: ColumnKey; label: string; minWidth: number; resizable: boolean }> = [
    { key: 'name', label: 'Name', minWidth: 220, resizable: true },
    { key: 'model', label: 'Model', minWidth: 220, resizable: true },
    { key: 'manufacturer', label: 'Manufacturer', minWidth: 260, resizable: true },
    { key: 'crew', label: 'Crew (editable)', minWidth: 160, resizable: true },
    { key: 'passengers', label: 'Passengers', minWidth: 160, resizable: true },
    { key: 'hyperdrive_rating', label: 'Hyperdrive', minWidth: 160, resizable: true },
    { key: 'MGLT', label: 'MGLT', minWidth: 120, resizable: true },
    { key: 'starship_class', label: 'Class', minWidth: 180, resizable: true },
  ];

  columnWidths: Record<ColumnKey, number> = {
    name: 260,
    model: 240,
    manufacturer: 320,
    crew: 180,
    passengers: 180,
    hyperdrive_rating: 160,
    MGLT: 120,
    starship_class: 200,
  };

  starships: Starship[] = [];

  // Initial load may show a spinner (allowed by the spec).
  loadingInitial = true;
  initialError: string | null = null;

  // While loading additional pages via scroll, we keep the UI seamless: no spinner/skeleton.
  // Errors during load-more are shown as a small banner with a retry.
  loadingMore = false;
  loadMoreError: string | null = null;

  hasReachedEnd = false;

  private nextPage = 1;

  // Defensive guard to avoid appending the same page twice (e.g. rapid scrolling).
  private loadedPages = new Set<number>();

  // Client-only edits: Map<starshipId, patched fields>. This can later be swapped for API writes.
  private editedValues = new Map<string, Partial<Starship>>();
  editing: EditingCell | null = null;

  // column resizing state
  private resizeState:
    | {
        col: ColumnKey;
        startX: number;
        startWidth: number;
      }
    | null = null;

  constructor(private readonly swapi: SwapiService) {}

  ngOnInit(): void {
    // Defer the initial async load to the next macrotask to avoid mutating bindings
    // during the same change detection cycle (prevents NG0100 in dev/test mode).
    setTimeout(() => void this.resetAndLoad());
  }

  get filteredStarships(): Starship[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.starships;
    return this.starships.filter((s) => s.name.toLowerCase().includes(term));
  }

  trackById(_: number, ship: Starship): string {
    return ship.id;
  }

  displayValue(ship: Starship, key: ColumnKey): string {
    const patch = this.editedValues.get(ship.id);
    const patched = patch && (patch as any)[key];
    return (patched ?? (ship as any)[key] ?? '') as string;
  }

  isEditing(shipId: string, field: 'crew'): boolean {
    return this.editing?.id === shipId && this.editing?.field === field;
  }

  beginEditCrew(ship: Starship): void {
    this.editing = {
      id: ship.id,
      field: 'crew',
      draft: this.displayValue(ship, 'crew'),
    };
  }

  onEditKeydown(event: KeyboardEvent): void {
    if (!this.editing) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitEdit();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEdit();
    }
  }

  commitEdit(): void {
    if (!this.editing) return;
    const { id, draft } = this.editing;

    const current = this.editedValues.get(id) ?? {};
    this.editedValues.set(id, { ...current, crew: draft });
    this.editing = null;
  }

  cancelEdit(): void {
    this.editing = null;
  }

  async retryInitial(): Promise<void> {
    await this.resetAndLoad();
  }

  async retryLoadMore(): Promise<void> {
    await this.loadNextPage();
  }

  onScroll(event: Event): void {
    // To avoid overfetch, while searching we do not fetch additional pages.
    // Search is applied to already-loaded rows.
    if (this.searchTerm.trim().length > 0) return;

    const el = event.target as HTMLElement;
    if (!el) return;

    if (this.loadingInitial || this.loadingMore || this.hasReachedEnd) return;

    const distanceToBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    if (distanceToBottom < 320) {
      void this.loadNextPage();
    }
  }

  startResize(event: MouseEvent, col: ColumnKey): void {
    event.preventDefault();
    event.stopPropagation();

    this.resizeState = {
      col,
      startX: event.clientX,
      startWidth: this.columnWidths[col],
    };

    const onMove = (e: MouseEvent) => this.onResizeMove(e);
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this.resizeState = null;
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private onResizeMove(event: MouseEvent): void {
    if (!this.resizeState) return;

    const { col, startX, startWidth } = this.resizeState;
    const delta = event.clientX - startX;
    const minWidth = this.columns.find((c) => c.key === col)?.minWidth ?? 80;

    const next = Math.max(minWidth, startWidth + delta);
    this.columnWidths = {
      ...this.columnWidths,
      [col]: next,
    };
  }

  private async resetAndLoad(): Promise<void> {
    this.loadingInitial = true;
    this.initialError = null;

    this.starships = [];
    this.hasReachedEnd = false;
    this.nextPage = 1;
    this.loadedPages = new Set<number>();

    try {
      await this.loadNextPage();
    } catch (e) {
      // loadNextPage already sets errors
    } finally {
      this.loadingInitial = false;
    }
  }

  private async loadNextPage(): Promise<void> {
    if (this.loadingMore || this.hasReachedEnd) return;

    const pageToLoad = this.nextPage;
    if (this.loadedPages.has(pageToLoad)) {
      this.nextPage = pageToLoad + 1;
      return;
    }

    this.loadingMore = true;
    this.loadMoreError = null;

    try {
      const data = await this.swapi.getStarships(pageToLoad);

      if (!this.loadedPages.has(pageToLoad)) {
        this.starships = [...this.starships, ...data.results];
        this.loadedPages.add(pageToLoad);
      }

      this.hasReachedEnd = data.next === null;
      this.nextPage = pageToLoad + 1;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      if (this.starships.length === 0) {
        this.initialError = message;
      } else {
        this.loadMoreError = message;
      }
      throw e;
    } finally {
      this.loadingMore = false;
    }
  }
}
