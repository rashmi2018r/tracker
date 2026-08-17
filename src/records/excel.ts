import * as XLSX from "xlsx";
import { UnreadableImportError } from "./errors";
import { formatCalendarDay } from "./today";
import type { RecordDraft, TrackingRecord } from "./types";

const HEADERS = [
  "Date",
  "Tracking ID",
  "Order Number",
  "Packed",
  "Fulfilled",
] as const;

type SheetRow = Record<string, unknown>;

export type ParsedImport = {
  drafts: RecordDraft[];
  skipped: number;
};

export function recordsToXlsx(records: TrackingRecord[]): Uint8Array {
  const rows = records.map((record) => ({
    Date: record.date,
    "Tracking ID": record.trackingId,
    "Order Number": record.orderNumber,
    Packed: record.packed,
    Fulfilled: record.fulfilled,
  }));
  const sheet = XLSX.utils.json_to_sheet(rows, { header: [...HEADERS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Records");
  return new Uint8Array(XLSX.write(workbook, { type: "array", bookType: "xlsx" }));
}

export function xlsxToDrafts(data: Uint8Array): ParsedImport {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: "array" });
  } catch {
    throw new UnreadableImportError();
  }
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new UnreadableImportError();
  }
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new UnreadableImportError();
  }
  const headers = sheetHeaders(sheet);
  if (!HEADERS.every((header) => headers.includes(header))) {
    throw new UnreadableImportError();
  }
  const rows = XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: "" });

  const drafts: RecordDraft[] = [];
  let skipped = 0;
  for (const row of rows) {
    const date = parseDate(row["Date"]);
    const trackingId = parseText(row["Tracking ID"]);
    if (!date || !trackingId) {
      skipped += 1;
      continue;
    }
    drafts.push({
      date,
      trackingId,
      orderNumber: parseText(row["Order Number"]),
      packed: parseBoolean(row["Packed"]),
      fulfilled: parseBoolean(row["Fulfilled"]),
    });
  }
  return { drafts, skipped };
}

function sheetHeaders(sheet: XLSX.WorkSheet): string[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  const first = rows[0];
  if (!Array.isArray(first)) {
    return [];
  }
  return first.map((header) => String(header));
}

function parseText(value: unknown) {
  if (value == null) {
    return "";
  }
  return String(value).trim();
}

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  const text = String(value ?? "")
    .trim()
    .toLowerCase();
  return text === "true" || text === "yes" || text === "1";
}

function parseDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatCalendarDay(
      value.getUTCFullYear(),
      value.getUTCMonth() + 1,
      value.getUTCDate(),
    );
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) {
      return null;
    }
    return formatCalendarDay(parsed.y, parsed.m, parsed.d);
  }
  const text = parseText(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }
  return null;
}
