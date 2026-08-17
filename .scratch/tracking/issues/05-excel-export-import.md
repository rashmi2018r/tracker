# 05 — Excel export and replace-import

**What to build:** On both pages, Export downloads a `.xlsx` of the entire live store. Import asks for confirm, then replaces every Record with the file. Cancelled or unreadable import leaves data unchanged. Excel is the backup; it is not a filtered slice and not an append.

**Blocked by:** 01 — Create a Record and see it persist on Today

**Status:** ready-for-agent

- [x] Header Export/Import are available on Today and All Records
- [x] Export is a full snapshot (Date, Tracking ID, Order Number, Packed, Fulfilled), ignoring page filters
- [x] Import shows a confirm that the file will replace everything; cancel leaves the store unchanged
- [x] Confirmed import of a readable sheet replaces the live store; new internal ids are assigned
- [x] Hand-typed sheet with those headers can be imported
- [x] Unreadable file or missing required headers: error, store unchanged
- [x] Rows missing Date or Tracking ID are skipped; operator is told how many loaded vs skipped
- [x] Store tests cover export/importReplace round-trip of field values, confirm-cancel, and unreadable file through the in-memory adapter
