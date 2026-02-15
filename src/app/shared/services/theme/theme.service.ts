import { inject, Injectable, signal } from '@angular/core';
import { StorageService } from '../storage/storage.service';

export type ThemeMode = 'system' | 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService);

  private readonly colorScheme = window.matchMedia(
    '(prefers-color-scheme: dark)',
  );

  readonly currentTheme = signal<ThemeMode>('system');

  constructor() {
    this.initTheme();
  }

  private async initTheme(): Promise<void> {
    const storedTheme = await this.storage.getItem<ThemeMode>('theme');

    if (storedTheme) {
      this.currentTheme.set(storedTheme);
    }

    this.applyTheme(this.currentTheme());

    this.colorScheme.addEventListener('change', (event) => {
      if (this.currentTheme() === 'system') {
        this.applyTheme(event.matches ? 'dark' : 'light');
      }
    });
  }

  setTheme(theme: ThemeMode): void {
    this.currentTheme.set(theme);
    this.storage.setItem('theme', theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: ThemeMode): void {
    const resolvedTheme =
      theme === 'system'
        ? this.colorScheme.matches
          ? 'dark'
          : 'light'
        : theme;

    document.documentElement.classList.toggle(
      'ion-palette-dark',
      resolvedTheme === 'dark',
    );
  }
}
