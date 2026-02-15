import { TestBed } from '@angular/core/testing';
import { ThemeService, ThemeMode } from './theme.service';
import { StorageService } from '../storage/storage.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let storage: StorageServiceMock;

  const matchMediaMock = {
    matches: false,
    addEventListener: jasmine.createSpy('addEventListener'),
  };

  class StorageServiceMock {
    private store = new Map<string, any>();

    async getItem<T>(key: string): Promise<T | null> {
      return this.store.get(key) ?? null;
    }

    async setItem<T>(key: string, value: T): Promise<void> {
      this.store.set(key, value);
    }
  }

  beforeEach(async () => {
    spyOn(window, 'matchMedia').and.returnValue(matchMediaMock as any);

    await TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: StorageService, useClass: StorageServiceMock },
      ],
    }).compileComponents();

    storage = TestBed.inject(StorageService) as unknown as StorageServiceMock;
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    document.documentElement.classList.remove('ion-palette-dark');
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debería inicializar con theme "system" si no hay valor en storage', () => {
    expect(service.currentTheme()).toBe('system');
  });

  it('debería aplicar theme dark cuando se setea explícitamente', () => {
    service.setTheme('dark');

    expect(service.currentTheme()).toBe('dark');
    expect(
      document.documentElement.classList.contains('ion-palette-dark'),
    ).toBeTrue();
  });

  it('debería aplicar theme light cuando se setea explícitamente', () => {
    service.setTheme('light');

    expect(service.currentTheme()).toBe('light');
    expect(
      document.documentElement.classList.contains('ion-palette-dark'),
    ).toBeFalse();
  });

  it('debería guardar el theme en storage al cambiarlo', async () => {
    const spy = spyOn(storage, 'setItem').and.callThrough();

    service.setTheme('dark');

    expect(spy).toHaveBeenCalledWith('theme', 'dark');
  });
});
