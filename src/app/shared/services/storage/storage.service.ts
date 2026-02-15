import { inject, Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private _storage: Storage | null = null;
  private readonly storage = inject(Storage);

  private async init(): Promise<void> {
    if (!this._storage) {
      this._storage = await this.storage.create();
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    await this.init();
    return (await this._storage?.get(key)) ?? null;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    await this.init();
    await this._storage?.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this.init();
    await this._storage?.remove(key);
  }

  async clear(): Promise<void> {
    await this.init();
    await this._storage?.clear();
  }
}
