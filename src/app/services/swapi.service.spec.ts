import { TestBed } from '@angular/core/testing';
import { firstValueFrom, take } from 'rxjs';

import {
  SwapiService,
  mergeStarshipPages,
  nextPageFromNextUrl,
} from './swapi.service';

function makeSwapiStarship(overrides: Partial<any> = {}) {
  return {
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

describe('SwapiService', () => {
  let service: SwapiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SwapiService);
  });

  afterEach(() => {
    // @ts-expect-error test cleanup
    globalThis.fetch = undefined;
    service.clearCache();
  });

  it('nextPageFromNextUrl() should parse the page param', () => {
    expect(nextPageFromNextUrl('https://swapi.dev/api/starships/?page=3')).toBe(3);
    expect(nextPageFromNextUrl(null)).toBeNull();
  });

  it('getStarships() should cache pages and avoid refetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        count: 1,
        next: null,
        previous: null,
        results: [makeSwapiStarship()],
      }),
    });

    globalThis.fetch = fetchMock as any;

    const first = await service.getStarships(1);
    const second = await service.getStarships(1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.results[0].id).toBe('12');
    expect(second.results[0].id).toBe('12');
  });

  it('loadStarshipsPage() should emit errors on error$', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: async () => ({}),
    }) as any;

    const emitted = firstValueFrom(service.error$.pipe(take(1)));

    await service.loadStarshipsPage(1);

    const { page, error } = await emitted;
    expect(page).toBe(1);
    expect(error).toBeTruthy();
  });

  it('mergeStarshipPages() should combine results from multiple pages', () => {
    const p1 = {
      count: 2,
      next: 'https://swapi.dev/api/starships/?page=2',
      previous: null,
      results: [{ ...(makeSwapiStarship({ url: 'https://swapi.dev/api/starships/1/' })), id: '1' }],
    };

    const p2 = {
      count: 2,
      next: null,
      previous: 'https://swapi.dev/api/starships/?page=1',
      results: [{ ...(makeSwapiStarship({ url: 'https://swapi.dev/api/starships/2/' })), id: '2' }],
    };

    const merged = mergeStarshipPages([p1 as any, p2 as any]);
    expect(merged.map((s) => s.id)).toEqual(['1', '2']);
  });
});
