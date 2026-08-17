import { describe, expect, test } from "vitest";
import * as XLSX from "xlsx";
import { StorageFullError, UnreadableImportError, ValidationError } from "./errors";
import { createMemoryAdapter } from "./memory-adapter";
import { createRecordStore } from "./store";
import type { PersistenceAdapter, RecordDraft } from "./types";

function storeWith(records: never[] = []) {
  return createRecordStore(createMemoryAdapter(records));
}

function draft(overrides: Partial<RecordDraft> = {}): RecordDraft {
  return {
    date: "2026-08-17",
    trackingId: "1Z999",
    orderNumber: "1001",
    packed: false,
    fulfilled: false,
    ...overrides,
  };
}

function sheetBytes(headers: string[], rows: unknown[][] = []) {
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  return new Uint8Array(XLSX.write(workbook, { type: "array", bookType: "xlsx" }));
}

describe("Record store", () => {
  test("create makes a Record retrievable by list", async () => {
    const store = storeWith();

    const created = await store.create(draft());
    const listed = await store.list();

    expect(listed).toEqual([
      {
        id: created.id,
        date: "2026-08-17",
        trackingId: "1Z999",
        orderNumber: "1001",
        packed: false,
        fulfilled: false,
      },
    ]);
  });

  test("create rejects an empty Tracking ID", async () => {
    const store = storeWith();

    await expect(store.create(draft({ trackingId: "  " }))).rejects.toThrow(
      ValidationError,
    );
    expect(await store.list()).toEqual([]);
  });

  test("create rejects an empty Date", async () => {
    const store = storeWith();

    await expect(store.create(draft({ date: "  " }))).rejects.toThrow(
      ValidationError,
    );
    expect(await store.list()).toEqual([]);
  });

  test("create allows an empty Order Number", async () => {
    const store = storeWith();

    const created = await store.create(
      draft({ orderNumber: undefined }),
    );

    expect(created.orderNumber).toBe("");
    expect(await store.list()).toEqual([created]);
  });

  test("create defaults Packed and Fulfilled to false", async () => {
    const store = storeWith();

    const created = await store.create({
      date: "2026-08-17",
      trackingId: "1Z999",
    });

    expect(created.packed).toBe(false);
    expect(created.fulfilled).toBe(false);
  });

  test("two Records may share a Tracking ID", async () => {
    const store = storeWith();

    await store.create(draft({ trackingId: "SAME", orderNumber: "1001" }));
    await store.create(draft({ trackingId: "SAME", orderNumber: "1002" }));

    const listed = await store.list();
    expect(listed).toHaveLength(2);
    expect(listed.map((record) => record.trackingId)).toEqual(["SAME", "SAME"]);
  });

  test("two Records may share an Order Number", async () => {
    const store = storeWith();

    await store.create(draft({ trackingId: "A", orderNumber: "1001" }));
    await store.create(draft({ trackingId: "B", orderNumber: "1001" }));

    const listed = await store.list();
    expect(listed).toHaveLength(2);
    expect(listed.map((record) => record.orderNumber)).toEqual(["1001", "1001"]);
  });

  test("list returns only Records whose Date is in the filter range", async () => {
    const store = storeWith();
    await store.create(draft({ date: "2026-08-16", trackingId: "YEST" }));
    const today = await store.create(
      draft({ date: "2026-08-17", trackingId: "TODAY" }),
    );

    const listed = await store.list({
      dateFrom: "2026-08-17",
      dateTo: "2026-08-17",
    });

    expect(listed).toEqual([today]);
  });

  test("quota error on write is a storage-full failure", async () => {
    const adapter: PersistenceAdapter = {
      async load() {
        return [];
      },
      async save() {
        const error = new Error("Quota exceeded");
        error.name = "QuotaExceededError";
        throw error;
      },
    };
    const store = createRecordStore(adapter);

    await expect(store.create(draft())).rejects.toThrow(StorageFullError);
  });

  test("update changes every field of an existing Record", async () => {
    const store = storeWith();
    const created = await store.create(draft());

    const updated = await store.update(created.id, {
      date: "2026-08-16",
      trackingId: "1Z000",
      orderNumber: "2002",
      packed: true,
      fulfilled: true,
    });

    expect(updated).toEqual({
      id: created.id,
      date: "2026-08-16",
      trackingId: "1Z000",
      orderNumber: "2002",
      packed: true,
      fulfilled: true,
    });
    expect(await store.list()).toEqual([updated]);
  });

  test("update can set Packed without changing Fulfilled", async () => {
    const store = storeWith();
    const created = await store.create(draft({ packed: false, fulfilled: false }));

    const updated = await store.update(created.id, {
      ...created,
      packed: true,
    });

    expect(updated.packed).toBe(true);
    expect(updated.fulfilled).toBe(false);
  });

  test("update rejects an empty Tracking ID or Date", async () => {
    const store = storeWith();
    const created = await store.create(draft());

    await expect(
      store.update(created.id, { ...created, trackingId: "" }),
    ).rejects.toThrow(ValidationError);
    await expect(
      store.update(created.id, { ...created, date: "" }),
    ).rejects.toThrow(ValidationError);
    expect(await store.list()).toEqual([created]);
  });

  test("delete removes a Record from the store", async () => {
    const store = storeWith();
    const created = await store.create(draft());

    await store.delete(created.id);

    expect(await store.list()).toEqual([]);
  });

  test("counts match the Records that pass a filter", async () => {
    const store = storeWith();
    await store.create(draft({ packed: true, fulfilled: false }));
    await store.create(draft({ packed: true, fulfilled: true }));
    await store.create(draft({ packed: false, fulfilled: false }));

    expect(await store.counts({ packed: "yes" })).toEqual({
      total: 2,
      packed: 2,
      notPacked: 0,
      fulfilled: 1,
      notFulfilled: 1,
    });
  });

  test("packed and fulfilled filters AND together", async () => {
    const store = storeWith();
    await store.create(draft({ trackingId: "A", packed: true, fulfilled: true }));
    const match = await store.create(
      draft({ trackingId: "B", packed: true, fulfilled: false }),
    );
    await store.create(draft({ trackingId: "C", packed: false, fulfilled: false }));

    const filter = { packed: "yes" as const, fulfilled: "no" as const };
    expect(await store.list(filter)).toEqual([match]);
    expect(await store.counts(filter)).toEqual({
      total: 1,
      packed: 1,
      notPacked: 0,
      fulfilled: 0,
      notFulfilled: 1,
    });
  });

  test("text and date filters AND together; empty text means any", async () => {
    const store = storeWith();
    const match = await store.create(
      draft({
        date: "2026-08-11",
        trackingId: "1ZABC",
        orderNumber: "1001",
        packed: false,
      }),
    );
    await store.create(
      draft({
        date: "2026-08-11",
        trackingId: "1ZABC",
        orderNumber: "2002",
        packed: false,
      }),
    );
    await store.create(
      draft({
        date: "2026-08-11",
        trackingId: "OTHER",
        orderNumber: "1001",
        packed: false,
      }),
    );

    const listed = await store.list({
      dateFrom: "2026-08-11",
      dateTo: "2026-08-11",
      packed: "no",
      trackingIdContains: "abc",
      orderNumberContains: "100",
    });
    expect(listed).toEqual([match]);

    const all = await store.list({
      trackingIdContains: "",
      orderNumberContains: "   ",
    });
    expect(all).toHaveLength(3);
  });

  test("export then importReplace keeps field values and assigns new ids", async () => {
    const source = storeWith();
    await source.create(
      draft({
        date: "2026-08-17",
        trackingId: "1Z999",
        orderNumber: "1001",
        packed: true,
        fulfilled: false,
      }),
    );
    const snapshot = await source.exportAll();

    const target = storeWith();
    await target.create(draft({ trackingId: "OLD" }));
    const result = await target.importReplace(snapshot);
    const listed = await target.list();

    expect(result).toEqual({ loaded: 1, skipped: 0 });
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).not.toBeUndefined();
    expect(listed[0]).toMatchObject({
      date: "2026-08-17",
      trackingId: "1Z999",
      orderNumber: "1001",
      packed: true,
      fulfilled: false,
    });
  });

  test("unreadable import leaves the live store unchanged", async () => {
    const store = storeWith();
    const existing = await store.create(draft());

    await expect(
      store.importReplace(new Uint8Array([1, 2, 3, 4])),
    ).rejects.toThrow(UnreadableImportError);
    expect(await store.list()).toEqual([existing]);
  });

  test("import with missing required headers leaves the live store unchanged", async () => {
    const store = storeWith();
    const existing = await store.create(draft());
    const file = sheetBytes(["Nope"], [["x"]]);

    await expect(store.importReplace(file)).rejects.toThrow(UnreadableImportError);
    expect(await store.list()).toEqual([existing]);
  });

  test("import skips rows missing Date or Tracking ID and reports loaded vs skipped", async () => {
    const store = storeWith();
    await store.create(draft({ trackingId: "OLD" }));
    const file = sheetBytes(
      ["Date", "Tracking ID", "Order Number", "Packed", "Fulfilled"],
      [
        ["2026-08-17", "1Z111", "1001", true, false],
        ["", "1Z222", "1002", false, false],
        ["2026-08-17", "", "1003", false, false],
      ],
    );

    const result = await store.importReplace(file);
    const listed = await store.list();

    expect(result).toEqual({ loaded: 1, skipped: 2 });
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({
      date: "2026-08-17",
      trackingId: "1Z111",
      orderNumber: "1001",
      packed: true,
      fulfilled: false,
    });
  });

  test("readable import with zero valid rows replaces the live store with empty", async () => {
    const store = storeWith();
    await store.create(draft());
    const file = sheetBytes(
      ["Date", "Tracking ID", "Order Number", "Packed", "Fulfilled"],
    );

    const result = await store.importReplace(file);

    expect(result).toEqual({ loaded: 0, skipped: 0 });
    expect(await store.list()).toEqual([]);
  });

  test("import treats an Excel serial Date as that calendar day", async () => {
    const store = storeWith();
    const file = sheetBytes(
      ["Date", "Tracking ID", "Order Number", "Packed", "Fulfilled"],
      [[46251, "1Z111", "1001", true, false]],
    );

    const result = await store.importReplace(file);
    const listed = await store.list();

    expect(result).toEqual({ loaded: 1, skipped: 0 });
    expect(listed[0]).toMatchObject({
      date: "2026-08-17",
      trackingId: "1Z111",
    });
  });
});
