import { openDB, type IDBPDatabase } from 'idb';
import type { SyncQueueItem } from '../types/erp.types';

const DB_NAME = 'arabian_mandi_erp_db';
const DB_VERSION = 1;

class IndexedDBService {
  private dbPromise: Promise<IDBPDatabase> | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    if (typeof window === 'undefined') return null;
    this.dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('offlineOrders')) {
          db.createObjectStore('offlineOrders', { keyPath: '_id' });
        }
        if (!db.objectStoreNames.contains('offlineBills')) {
          db.createObjectStore('offlineBills', { keyPath: '_id' });
        }
      },
    });
    return this.dbPromise;
  }

  public async enqueueSyncItem(item: SyncQueueItem): Promise<void> {
    const db = await this.dbPromise;
    if (!db) return;
    await db.put('syncQueue', item);
  }

  public async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    const db = await this.dbPromise;
    if (!db) return [];
    const all = await db.getAll('syncQueue');
    return all.filter((item) => !item.synced);
  }

  public async markItemSynced(id: string): Promise<void> {
    const db = await this.dbPromise;
    if (!db) return;
    const item = await db.get('syncQueue', id);
    if (item) {
      item.synced = true;
      await db.put('syncQueue', item);
    }
  }

  public async clearSyncedItems(): Promise<void> {
    const db = await this.dbPromise;
    if (!db) return;
    const all = await db.getAll('syncQueue');
    const tx = db.transaction('syncQueue', 'readwrite');
    for (const item of all) {
      if (item.synced) {
        await tx.store.delete(item.id);
      }
    }
    await tx.done;
  }
}

export const idbService = new IndexedDBService();
