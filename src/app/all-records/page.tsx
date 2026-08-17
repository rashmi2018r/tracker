"use client";

import { useMemo, useState } from "react";
import { BooleanFilterSelect, RecordWorkspace } from "@/components/RecordWorkspace";
import { useLocalToday } from "@/components/useLocalToday";
import { type BooleanFilter } from "@/records";

export default function AllRecordsPage() {
  const today = useLocalToday();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [packed, setPacked] = useState<BooleanFilter>("any");
  const [fulfilled, setFulfilled] = useState<BooleanFilter>("any");
  const [trackingIdContains, setTrackingIdContains] = useState("");
  const [orderNumberContains, setOrderNumberContains] = useState("");

  const filter = useMemo(
    () => ({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      packed,
      fulfilled,
      trackingIdContains,
      orderNumberContains,
    }),
    [dateFrom, dateTo, packed, fulfilled, trackingIdContains, orderNumberContains],
  );

  if (!today) {
    return <p className="empty">Loading…</p>;
  }

  return (
    <RecordWorkspace
      title="All Records"
      filter={filter}
      defaultDate={today}
      filters={
        <div className="filters">
          <label>
            Date from
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>
          <label>
            Date to
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>
          <BooleanFilterSelect label="Packed" value={packed} onChange={setPacked} />
          <BooleanFilterSelect
            label="Fulfilled"
            value={fulfilled}
            onChange={setFulfilled}
          />
          <label>
            Tracking ID
            <input
              type="text"
              value={trackingIdContains}
              onChange={(event) => setTrackingIdContains(event.target.value)}
              placeholder="contains"
            />
          </label>
          <label>
            Order Number
            <input
              type="text"
              value={orderNumberContains}
              onChange={(event) => setOrderNumberContains(event.target.value)}
              placeholder="contains"
            />
          </label>
          <div className="actions">
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setPacked("any");
                setFulfilled("any");
                setTrackingIdContains("");
                setOrderNumberContains("");
              }}
            >
              Clear filters
            </button>
          </div>
        </div>
      }
    />
  );
}
