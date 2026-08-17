export type RecordId = string;

export type TrackingRecord = {
  id: RecordId;
  date: string;
  trackingId: string;
  orderNumber: string;
  packed: boolean;
  fulfilled: boolean;
};

export type RecordDraft = {
  date: string;
  trackingId: string;
  orderNumber?: string;
  packed?: boolean;
  fulfilled?: boolean;
};

export type PersistenceAdapter = {
  load(): Promise<TrackingRecord[]>;
  save(records: TrackingRecord[]): Promise<void>;
};

export type BooleanFilter = "any" | "yes" | "no";

export type RecordFilter = {
  dateFrom?: string;
  dateTo?: string;
  packed?: BooleanFilter;
  fulfilled?: BooleanFilter;
  trackingIdContains?: string;
  orderNumberContains?: string;
};

export type RecordCounts = {
  total: number;
  packed: number;
  notPacked: number;
  fulfilled: number;
  notFulfilled: number;
};

export type ImportResult = {
  loaded: number;
  skipped: number;
};

export type RecordStore = {
  create(draft: RecordDraft): Promise<TrackingRecord>;
  update(id: RecordId, draft: RecordDraft): Promise<TrackingRecord>;
  delete(id: RecordId): Promise<void>;
  list(filter?: RecordFilter): Promise<TrackingRecord[]>;
  counts(filter?: RecordFilter): Promise<RecordCounts>;
  exportAll(): Promise<Uint8Array>;
  importReplace(data: Uint8Array): Promise<ImportResult>;
};
