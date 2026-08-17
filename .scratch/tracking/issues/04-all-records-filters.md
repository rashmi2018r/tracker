# 04 — All Records page with AND filters

**What to build:** All Records is the hunt-and-backfill page: date range, Packed, Fulfilled, Tracking ID contains, Order Number contains, all AND together; counts match the filtered table; create/edit/delete work here the same as Today.

**Blocked by:** 03 — Today counts and Packed/Fulfilled filters

**Status:** ready-for-agent

- [x] Header nav switches between Today and All Records
- [x] Filters: Date from, Date to (inclusive), Packed any/yes/no, Fulfilled any/yes/no, Tracking ID contains, Order Number contains
- [x] All active filters AND together; empty text means any; clearing filters shows the full live store
- [x] Counts on this page match the current filters
- [x] Operator can add (including backfill Date), edit, and delete Records here
- [x] Store tests cover date range and text-contains AND filters through the in-memory adapter
