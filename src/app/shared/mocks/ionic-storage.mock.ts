export class IonicStorageMock {
  private store = new Map<string, any>();

  async create() {
    return {
      get: async (key: string) =>
        this.store.has(key) ? this.store.get(key) : null,

      set: async (key: string, value: any) => {
        this.store.set(key, value);
      },

      remove: async (key: string) => {
        this.store.delete(key);
      },

      clear: async () => {
        this.store.clear();
      },
    };
  }
}
