import type { PersistenceAdapter, TrackingRecord } from "./types";

export function createMemoryAdapter(
  initial: TrackingRecord[] = [],
): PersistenceAdapter {
  let records = initial.map((record) => ({ ...record }));
  return {
    async load() {
      return records.map((record) => ({ ...record }));
    },
    async save(next) {
      records = next.map((record) => ({ ...record }));
    },
  };
}
