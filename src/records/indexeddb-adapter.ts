import type { PersistenceAdapter, TrackingRecord } from "./types";

const DB_NAME = "tracking";
const DB_VERSION = 1;
const STORE_NAME = "state";
const RECORDS_KEY = "records";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function createIndexedDBAdapter(): PersistenceAdapter {
  return {
    async load() {
      const db = await openDatabase();
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const stored = await requestToPromise(
          tx.objectStore(STORE_NAME).get(RECORDS_KEY) as IDBRequest<
            TrackingRecord[] | undefined
          >,
        );
        return stored ?? [];
      } finally {
        db.close();
      }
    },
    async save(records) {
      const db = await openDatabase();
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(records, RECORDS_KEY);
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    },
  };
}
