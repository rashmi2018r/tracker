# 03 — Today counts and Packed/Fulfilled filters

**What to build:** Today is an end-of-day overview: counts for the visible set, plus AND filters for Packed and Fulfilled on today’s table, so the operator can see e.g. packed but not fulfilled.

**Blocked by:** 02 — Edit, check Packed/Fulfilled, and delete a Record

**Status:** ready-for-agent

- [x] Today shows counts: total, packed, not packed, fulfilled, not fulfilled
- [x] Counts and table only include Records whose Date is today (before additional filters)
- [x] Packed filter: any / yes / no; Fulfilled filter: any / yes / no; both AND together
- [x] Counts always match the currently filtered table
- [x] Clearing those filters returns to the full today set
- [x] Store tests cover counts(filter) and AND of packed/fulfilled through the in-memory adapter
