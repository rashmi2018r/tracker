import { recordsToXlsx, xlsxToDrafts } from "./excel";
import { StorageFullError, ValidationError } from "./errors";
import type {
  PersistenceAdapter,
  RecordCounts,
  RecordDraft,
  RecordFilter,
  RecordId,
  RecordStore,
  TrackingRecord,
} from "./types";

function validateDraft(draft: RecordDraft) {
  const date = draft.date.trim();
  const trackingId = draft.trackingId.trim();
  const fields: { date?: string; trackingId?: string } = {};
  if (!date) {
    fields.date = "Date is required";
  }
  if (!trackingId) {
    fields.trackingId = "Tracking ID is required";
  }
  if (fields.date || fields.trackingId) {
    throw new ValidationError(fields);
  }
}

function recordFromDraft(id: RecordId, draft: RecordDraft): TrackingRecord {
  validateDraft(draft);
  return {
    id,
    date: draft.date.trim(),
    trackingId: draft.trackingId.trim(),
    orderNumber: draft.orderNumber ?? "",
    packed: draft.packed ?? false,
    fulfilled: draft.fulfilled ?? false,
  };
}

function matchesBoolean(value: boolean, filter: "any" | "yes" | "no" | undefined) {
  if (!filter || filter === "any") {
    return true;
  }
  return filter === "yes" ? value : !value;
}

function matchesContains(value: string, query: string | undefined) {
  const needle = query?.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return value.toLowerCase().includes(needle);
}

function matchesFilter(record: TrackingRecord, filter: RecordFilter = {}) {
  if (filter.dateFrom && record.date < filter.dateFrom) {
    return false;
  }
  if (filter.dateTo && record.date > filter.dateTo) {
    return false;
  }
  if (!matchesBoolean(record.packed, filter.packed)) {
    return false;
  }
  if (!matchesBoolean(record.fulfilled, filter.fulfilled)) {
    return false;
  }
  if (!matchesContains(record.trackingId, filter.trackingIdContains)) {
    return false;
  }
  if (!matchesContains(record.orderNumber, filter.orderNumberContains)) {
    return false;
  }
  return true;
}

function countsFor(records: TrackingRecord[]): RecordCounts {
  let packed = 0;
  let fulfilled = 0;
  for (const record of records) {
    if (record.packed) {
      packed += 1;
    }
    if (record.fulfilled) {
      fulfilled += 1;
    }
  }
  return {
    total: records.length,
    packed,
    notPacked: records.length - packed,
    fulfilled,
    notFulfilled: records.length - fulfilled,
  };
}

function isQuotaError(error: unknown) {
  return error instanceof Error && error.name === "QuotaExceededError";
}

async function saveRecords(
  adapter: PersistenceAdapter,
  records: TrackingRecord[],
) {
  try {
    await adapter.save(records);
  } catch (error) {
    if (isQuotaError(error)) {
      throw new StorageFullError();
    }
    throw error;
  }
}

export function createRecordStore(adapter: PersistenceAdapter): RecordStore {
  return {
    async create(draft: RecordDraft) {
      const records = await adapter.load();
      const record = recordFromDraft(crypto.randomUUID(), draft);
      await saveRecords(adapter, [...records, record]);
      return record;
    },
    async update(id: RecordId, draft: RecordDraft) {
      const records = await adapter.load();
      const index = records.findIndex((record) => record.id === id);
      if (index === -1) {
        throw new Error("Record not found");
      }
      const updated = recordFromDraft(id, draft);
      const next = [...records];
      next[index] = updated;
      await saveRecords(adapter, next);
      return updated;
    },
    async delete(id: RecordId) {
      const records = await adapter.load();
      await saveRecords(
        adapter,
        records.filter((record) => record.id !== id),
      );
    },
    async list(filter?: RecordFilter) {
      const records = await adapter.load();
      return records.filter((record) => matchesFilter(record, filter));
    },
    async counts(filter?: RecordFilter) {
      const records = await adapter.load();
      return countsFor(records.filter((record) => matchesFilter(record, filter)));
    },
    async exportAll() {
      const records = await adapter.load();
      return recordsToXlsx(records);
    },
    async importReplace(data: Uint8Array) {
      const parsed = xlsxToDrafts(data);
      const records = parsed.drafts.map((draft) =>
        recordFromDraft(crypto.randomUUID(), draft),
      );
      await saveRecords(adapter, records);
      return { loaded: records.length, skipped: parsed.skipped };
    },
  };
}
