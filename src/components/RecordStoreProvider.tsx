"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createIndexedDBAdapter,
  createRecordStore,
  type RecordStore,
} from "@/records";

type RecordStoreContextValue = {
  store: RecordStore;
  revision: number;
  notifyChange: () => void;
};

const RecordStoreContext = createContext<RecordStoreContextValue | null>(null);

export function RecordStoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<RecordStore | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    setStore(createRecordStore(createIndexedDBAdapter()));
  }, []);

  const notifyChange = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  const value = useMemo(
    () => (store ? { store, revision, notifyChange } : null),
    [store, revision, notifyChange],
  );

  if (!value) {
    return <p className="empty">Loading…</p>;
  }

  return (
    <RecordStoreContext.Provider value={value}>
      {children}
    </RecordStoreContext.Provider>
  );
}

export function useRecordStore() {
  const value = useContext(RecordStoreContext);
  if (!value) {
    throw new Error("Record store is not available");
  }
  return value;
}
