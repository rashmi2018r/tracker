"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  StorageFullError,
  ValidationError,
  type BooleanFilter,
  type RecordCounts,
  type RecordDraft,
  type RecordFilter,
  type RecordId,
  type TrackingRecord,
} from "@/records";
import { useRecordStore } from "./RecordStoreProvider";

const emptyCounts: RecordCounts = {
  total: 0,
  packed: 0,
  notPacked: 0,
  fulfilled: 0,
  notFulfilled: 0,
};

type Props = {
  title: string;
  filter: RecordFilter;
  defaultDate: string;
  filters: ReactNode;
};

function emptyDraft(date: string): RecordDraft {
  return {
    date,
    trackingId: "",
    orderNumber: "",
    packed: false,
    fulfilled: false,
  };
}

export function RecordWorkspace({ title, filter, defaultDate, filters }: Props) {
  const { store, revision, notifyChange } = useRecordStore();
  const [records, setRecords] = useState<TrackingRecord[]>([]);
  const [counts, setCounts] = useState<RecordCounts>(emptyCounts);
  const [draft, setDraft] = useState<RecordDraft>(() => emptyDraft(defaultDate));
  const [editingId, setEditingId] = useState<RecordId | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    date?: string;
    trackingId?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [listed, counted] = await Promise.all([
        store.list(filter),
        store.counts(filter),
      ]);
      if (!cancelled) {
        setRecords(listed);
        setCounts(counted);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store, filter, revision]);

  function resetForm() {
    setDraft(emptyDraft(defaultDate));
    setEditingId(null);
    setFieldErrors({});
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    try {
      if (editingId) {
        await store.update(editingId, draft);
      } else {
        await store.create(draft);
      }
      resetForm();
      notifyChange();
    } catch (caught) {
      if (caught instanceof ValidationError) {
        setFieldErrors(caught.fields);
        return;
      }
      if (caught instanceof StorageFullError) {
        setError(caught.message);
        return;
      }
      setError("Save failed.");
    }
  }

  async function onToggle(
    record: TrackingRecord,
    field: "packed" | "fulfilled",
    value: boolean,
  ) {
    setError(null);
    try {
      await store.update(record.id, { ...record, [field]: value });
      notifyChange();
    } catch (caught) {
      if (caught instanceof StorageFullError) {
        setError(caught.message);
        return;
      }
      setError("Save failed.");
    }
  }

  async function onDelete(record: TrackingRecord) {
    const confirmed = window.confirm("Delete this Record? This cannot be undone.");
    if (!confirmed) {
      return;
    }
    setError(null);
    try {
      await store.delete(record.id);
      if (editingId === record.id) {
        resetForm();
      }
      notifyChange();
    } catch (caught) {
      if (caught instanceof StorageFullError) {
        setError(caught.message);
        return;
      }
      setError("Delete failed.");
    }
  }

  return (
    <section>
      <h1 className="page-title">{title}</h1>
      {error ? <div className="banner error">{error}</div> : null}
      <div className="counts">
        <div className="count">
          <b>{counts.total}</b>
          <span>Total</span>
        </div>
        <div className="count">
          <b>{counts.packed}</b>
          <span>Packed</span>
        </div>
        <div className="count">
          <b>{counts.notPacked}</b>
          <span>Not packed</span>
        </div>
        <div className="count">
          <b>{counts.fulfilled}</b>
          <span>Fulfilled</span>
        </div>
        <div className="count">
          <b>{counts.notFulfilled}</b>
          <span>Not fulfilled</span>
        </div>
      </div>

      <div className="panel">
        <h2>Filters</h2>
        {filters}
      </div>

      <div className="panel">
        <h2>{editingId ? "Edit Record" : "Add Record"}</h2>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Date
            <input
              type="date"
              value={draft.date}
              onChange={(event) =>
                setDraft((current) => ({ ...current, date: event.target.value }))
              }
            />
            {fieldErrors.date ? (
              <span className="field-error">{fieldErrors.date}</span>
            ) : null}
          </label>
          <label>
            Tracking ID
            <input
              type="text"
              value={draft.trackingId}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  trackingId: event.target.value,
                }))
              }
            />
            {fieldErrors.trackingId ? (
              <span className="field-error">{fieldErrors.trackingId}</span>
            ) : null}
          </label>
          <label>
            Order Number
            <input
              type="text"
              value={draft.orderNumber ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  orderNumber: event.target.value,
                }))
              }
            />
          </label>
          <div className="checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={Boolean(draft.packed)}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    packed: event.target.checked,
                  }))
                }
              />
              Packed
            </label>
            <label>
              <input
                type="checkbox"
                checked={Boolean(draft.fulfilled)}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    fulfilled: event.target.checked,
                  }))
                }
              />
              Fulfilled
            </label>
          </div>
          <div className="actions">
            <button type="submit">{editingId ? "Save" : "Add"}</button>
            {editingId ? (
              <button type="button" className="secondary" onClick={resetForm}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </div>

      {records.length === 0 ? (
        <p className="empty">No Records match these filters.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Tracking ID</th>
              <th>Order Number</th>
              <th>Packed</th>
              <th>Fulfilled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td className="num">{record.date}</td>
                <td>{record.trackingId}</td>
                <td>{record.orderNumber}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={record.packed}
                    onChange={(event) =>
                      void onToggle(record, "packed", event.target.checked)
                    }
                    aria-label="Packed"
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={record.fulfilled}
                    onChange={(event) =>
                      void onToggle(record, "fulfilled", event.target.checked)
                    }
                    aria-label="Fulfilled"
                  />
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setEditingId(record.id);
                        setDraft({
                          date: record.date,
                          trackingId: record.trackingId,
                          orderNumber: record.orderNumber,
                          packed: record.packed,
                          fulfilled: record.fulfilled,
                        });
                        setFieldErrors({});
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => void onDelete(record)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function BooleanFilterSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: BooleanFilter;
  onChange: (value: BooleanFilter) => void;
}) {
  return (
    <label>
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as BooleanFilter)}
      >
        <option value="any">Any</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </label>
  );
}
