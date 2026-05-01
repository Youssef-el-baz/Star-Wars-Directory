import { TestBed } from '@angular/core/testing';

import { SwapiService } from '../../services/swapi.service';
import { StarshipGridComponent } from './starship-grid.component';

function makeStarship(overrides: Partial<any> = {}) {
  return {
    id: '12',
    name: 'X-wing',
    model: 'T-65 X-wing',
    manufacturer: 'Incom Corporation',
    cost_in_credits: '149999',
    length: '12.5',
    max_atmosphering_speed: '1050',
    crew: '1',
    passengers: '0',
    cargo_capacity: '110',
    consumables: '1 week',
    hyperdrive_rating: '1.0',
    MGLT: '100',
    starship_class: 'Starfighter',
    pilots: [],
    films: [],
    created: '2014-12-12T11:19:05.340000Z',
    edited: '2014-12-20T21:23:49.886000Z',
    url: 'https://swapi.dev/api/starships/12/',
    ...overrides,
  };
}

describe('StarshipGridComponent', () => {
  it('should allow editing crew cell (dblclick -> input -> Enter saves)', async () => {
    const swapiMock = {
        getStarships: vi.fn().mockResolvedValue({
          count: 1,
          next: null,
          previous: null,
          results: [makeStarship()],
        }),
      };

      await TestBed.configureTestingModule({
        imports: [StarshipGridComponent],
        providers: [{ provide: SwapiService, useValue: swapiMock }],
      }).compileComponents();

      const fixture = TestBed.createComponent(StarshipGridComponent);

      // Prevent the component from auto-starting its async load via setTimeout.
      (fixture.componentInstance as any).ngOnInit = () => {};
      fixture.detectChanges(false);

      await fixture.componentInstance.retryInitial();
      fixture.detectChanges(false);

      expect(fixture.componentInstance.loadingInitial).toBe(false);
      expect(fixture.componentInstance.starships.length).toBe(1);

      const host = fixture.nativeElement as HTMLElement;

      const crewCellButton = host.querySelector('tbody tr td:nth-child(4) button') as HTMLButtonElement;
      expect(crewCellButton).toBeTruthy();

      crewCellButton.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      fixture.detectChanges(false);

      const input = host.querySelector('tbody tr td:nth-child(4) input') as HTMLInputElement;
      expect(input).toBeTruthy();

      input.value = '2';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      fixture.detectChanges(false);

      const updatedButton = host.querySelector('tbody tr td:nth-child(4) button') as HTMLButtonElement;
      expect(updatedButton.textContent).toContain('2');
  });

  it('should show empty state when search filters out all rows', async () => {
    const swapiMock = {
        getStarships: vi.fn().mockResolvedValue({
          count: 1,
          next: null,
          previous: null,
          results: [makeStarship({ name: 'X-wing' })],
        }),
      };

      await TestBed.configureTestingModule({
        imports: [StarshipGridComponent],
        providers: [{ provide: SwapiService, useValue: swapiMock }],
      }).compileComponents();

      const fixture = TestBed.createComponent(StarshipGridComponent);
      const component = fixture.componentInstance;

      (fixture.componentInstance as any).ngOnInit = () => {};
      fixture.detectChanges(false);

      await fixture.componentInstance.retryInitial();
      fixture.detectChanges(false);

      expect(fixture.componentInstance.loadingInitial).toBe(false);
      expect(fixture.componentInstance.starships.length).toBe(1);

      component.searchTerm = 'zzzz';
      fixture.detectChanges(false);

      const host = fixture.nativeElement as HTMLElement;
      expect(host.textContent).toContain('No starships match your search');
  });
});
