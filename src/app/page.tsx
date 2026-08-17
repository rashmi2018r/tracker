"use client";

import { useMemo, useState } from "react";
import { BooleanFilterSelect, RecordWorkspace } from "@/components/RecordWorkspace";
import { useLocalToday } from "@/components/useLocalToday";
import { type BooleanFilter } from "@/records";

export default function TodayPage() {
  const today = useLocalToday();
  const [packed, setPacked] = useState<BooleanFilter>("any");
  const [fulfilled, setFulfilled] = useState<BooleanFilter>("any");
  const filter = useMemo(
    () =>
      today
        ? { dateFrom: today, dateTo: today, packed, fulfilled }
        : null,
    [today, packed, fulfilled],
  );

  if (!today || !filter) {
    return <p className="empty">Loading…</p>;
  }

  return (
    <RecordWorkspace
      title={`Today — ${today}`}
      filter={filter}
      defaultDate={today}
      filters={
        <div className="filters">
          <BooleanFilterSelect label="Packed" value={packed} onChange={setPacked} />
          <BooleanFilterSelect
            label="Fulfilled"
            value={fulfilled}
            onChange={setFulfilled}
          />
          <div className="actions">
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setPacked("any");
                setFulfilled("any");
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
