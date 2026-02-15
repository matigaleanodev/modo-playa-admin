export class StorageServiceMock {
  private store = new Map<string, any>();

  getItem<T>(key: string): Promise<T | null> {
    return Promise.resolve(this.store.get(key) ?? null);
  }

  setItem<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
    return Promise.resolve();
  }
}
