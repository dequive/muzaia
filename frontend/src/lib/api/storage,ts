export interface StorageAdapter {
  get(key: string): Promise<any>
  set(key: string, value: any): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
}

export class LocalStorageAdapter implements StorageAdapter {
  async get(key: string) {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  }

  async set(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value))
  }

  async delete(key: string) {
    localStorage.removeItem(key)
  }

  async clear() {
    localStorage.clear()
  }
}

export class IndexedDBAdapter implements StorageAdapter {
  // Implementação do adapter para IndexedDB
}
