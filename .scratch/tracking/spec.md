# Tracking — Record log

**Status:** ready-for-agent

## Problem Statement

A single person needs to log packing and fulfillment work during the day (date, tracking id, order number, packed, fulfilled), glance at today’s totals at end of day, find older Records with filters, and keep a file backup — without accounts, without a hosted database, on one machine, deployed to Vercel.

## Solution

A Next.js web app with two pages. **Today** is the end-of-day overview: counts for today, today’s table, and create/edit/delete. **All Records** is the hunt-and-backfill page: filters combined with AND, counts that match those filters, and create/edit/delete. Live data is IndexedDB in that browser. Export downloads a full Excel snapshot; import replaces the live store after confirm. No login.

## User Stories

1. As the operator, I want to open the app with no sign-in, so that I can start logging immediately on my one machine.
2. As the operator, I want a Today page, so that end of day is one glance at today’s work.
3. As the operator, I want an All Records page, so that I can hunt across days without leaving the log.
4. As the operator, I want Export and Import in the header on both pages, so that backup is not a third place I forget.
5. As the operator, I want to add a Record on Today, so that I can log work as it happens.
6. As the operator, I want Date to default to today in the local timezone, so that I rarely type the date.
7. As the operator, I want to override Date when creating, so that I can backfill a forgotten day.
8. As the operator, I want Tracking ID to be required, so that I do not save a blank line I cannot find later.
9. As the operator, I want Order Number to be optional, so that I can log a scanned label without an invoice number.
10. As the operator, I want Packed to default to unchecked, so that a new Record starts as not packed.
11. As the operator, I want Fulfilled to default to unchecked, so that a new Record starts as not fulfilled.
12. As the operator, I want Packed and Fulfilled to be independent, so that packed-but-not-fulfilled is a real state.
13. As the operator, I want to save a Record that shares a Tracking ID with another Record, so that uniqueness never blocks logging.
14. As the operator, I want to save a Record that shares an Order Number with another Record, so that one order can appear many times.
15. As the operator, I want to see the new Record in today’s table after save, so that I know it stuck.
16. As the operator, I want Records to still be there after I reload the browser, so that the day is not lost on refresh.
17. As the operator, I want to edit Date, Tracking ID, Order Number, Packed, and Fulfilled after save, so that typos and late courier updates do not require delete-and-recreate.
18. As the operator, I want to check and uncheck Packed on a row, so that I can mark packing without opening a heavy form.
19. As the operator, I want to check and uncheck Fulfilled on a row, so that I can mark collection without opening a heavy form.
20. As the operator, I want to delete a Record, so that a cancelled or accidental log can be removed.
21. As the operator, I want delete to ask for confirmation, so that a misclick does not destroy a row.
22. As the operator, I want today’s counts for total, packed, not packed, fulfilled, and not fulfilled, so that end of day is numbers I can act on.
23. As the operator, I want those Today counts to include only Records whose Date is today, so that yesterday does not pollute EOD.
24. As the operator, I want to filter today’s table by Packed (any / yes / no), so that I can see what still needs packing.
25. As the operator, I want to filter today’s table by Fulfilled (any / yes / no), so that I can see what still needs collection.
26. As the operator, I want Today filters to combine with AND, so that packed-but-not-fulfilled is one click pair.
27. As the operator, I want Today counts to follow the Today table filters, so that the numbers match the rows I am looking at.
28. As the operator, I want to add a Record from All Records, so that I can backfill without going back to Today.
29. As the operator, I want to filter All Records by a Date from-and-to range, so that I can retrieve last week without a “open one day” screen.
30. As the operator, I want to filter All Records by Packed (any / yes / no), so that I can find unpacked work across days.
31. As the operator, I want to filter All Records by Fulfilled (any / yes / no), so that I can find uncollected work across days.
32. As the operator, I want to filter All Records by Tracking ID text (contains), so that I can find one carrier id in a large log.
33. As the operator, I want to filter All Records by Order Number text (contains), so that I can find every box for an order.
34. As the operator, I want All Records filters to combine with AND, so that “last Tuesday, unpacked, order 1001” is one query.
35. As the operator, I want empty text filters to mean “any”, so that I do not have to type a wildcard.
36. As the operator, I want All Records counts to match the current filters, so that the page never lies about the table.
37. As the operator, I want to clear All Records filters, so that I can see the full live store again.
38. As the operator, I want to edit and delete on All Records the same way as Today, so that hunt-and-fix is one page.
39. As the operator, I want Export to download a `.xlsx` of every Record in the live store, so that the file is a full backup of the DB.
40. As the operator, I want the sheet columns to be Date, Tracking ID, Order Number, Packed, and Fulfilled, so that I can read the file in Excel.
41. As the operator, I want Export to ignore the current page filters, so that a backup is never a filtered slice by accident.
42. As the operator, I want Import to ask me to confirm that the file will replace everything, so that a 3-row sheet cannot silently wipe the log.
43. As the operator, I want Import, after confirm, to replace the entire live store with the file’s rows, so that restore is real restore.
44. As the operator, I want to import a sheet I typed by hand with those same columns, so that Excel can be a way to load a new set of Records.
45. As the operator, I want Import to reject a file that is not a readable sheet with those columns, so that a random file does not empty the store.
46. As the operator, I want Import to skip or reject individual rows missing Date or Tracking ID, and tell me how many loaded vs skipped, so that a messy sheet does not fail silently.
47. As the operator, I want cancelled Import to leave the live store unchanged, so that confirm is not a trap.
48. As the operator, I want Records to stay until I delete them or replace them by import, so that there is no 90-day auto-delete.
49. As the operator, I want a clear error if a save fails because browser storage is actually full, so that I know to export or delete instead of thinking save worked.
50. As the operator, I want to keep adding Records when storage is not full, so that capacity nags do not appear in normal use.
51. As the operator, I want the app to work after deploy to Vercel with no env vars and no database product, so that hosting is just static files.
52. As the operator, I want a new browser or a cleared site data to show an empty log, so that I understand the data lives in this browser and Excel is the backup.
53. As the operator, I want validation errors on missing Tracking ID or Date to stay on the form, so that I can fix the row without guessing.
54. As the operator, I do not want a duplicate action, so that I cannot accidentally clone a log I only meant to edit.

## Implementation Decisions

- One seam: a **Record store**. The UI never talks to IndexedDB or to an Excel library directly. Callers use create, update, delete, list(filter), counts(filter), exportAll, importReplace.
- Two adapters at that seam: IndexedDB for the running app, in-memory for tests. Filter, count, validation, and Excel snapshot logic sit in the store module, not in page components.
- A Record has an internal id (identity). Tracking ID and Order Number are fields, not keys. Internal id is not included in the Excel file; import assigns new ids.
- Date is a calendar day in the machine local timezone, stored and exported as `YYYY-MM-DD`. Packed and Fulfilled export as booleans Excel can show as TRUE/FALSE.
- Filter object: dateFrom and dateTo (inclusive, optional), packed (`any` | `yes` | `no`), fulfilled (`any` | `yes` | `no`), trackingIdContains (string), orderNumberContains (string). All present constraints AND together. Missing/empty text means any. Today’s page uses dateFrom = dateTo = today, plus packed/fulfilled filters.
- list and counts take the same filter. Counts: total, packed, notPacked, fulfilled, notFulfilled over the filtered set.
- Create/update reject missing Date or missing Tracking ID. Order Number may be empty. Packed and Fulfilled default false.
- Import replace: parse first sheet, map columns by header name, validate rows, then atomically replace the store. Zero valid rows after parse still replaces with empty if the file was readable and the user confirmed — unless the file was unreadable, in which case the store is unchanged. Unreadable or missing required headers: error, store unchanged.
- Quota: if the IndexedDB adapter throws a quota error on write, the store surfaces a storage-full error. The UI shows it and does not pretend the Record saved. No proactive quota warnings.
- App is Next.js, client-side data, deployable to Vercel with no API routes, no auth, no env secrets.
- Header on both pages: nav (Today, All Records), Export, Import.
- Delete and Import replace require confirm. Edit-in-place of Packed/Fulfilled does not.

## Testing Decisions

- Tests cover behaviour through the Record store interface, using the in-memory adapter. They do not assert on IndexedDB internals, React component trees, or Excel library APIs.
- Good tests: create/list survives; validation rejects empty Tracking ID; two Records may share a Tracking ID; counts match a filter; AND filters narrow; export then importReplace yields the same field values (new ids ok); unreadable import leaves data; quota error on write is visible as a storage-full failure.
- There is no existing test suite in this repo; this store interface is the first test surface.
- IndexedDB adapter wiring can be checked with a thin smoke test or by manual reload in the browser. Do not duplicate store behaviour tests against IndexedDB.

## Out of Scope

- Accounts, logins, PINs, or hiding the public URL.
- Server database, Vercel Blob, or any service that stores Records off-machine.
- Sync across devices or browsers.
- Duplicate Record action.
- Uniqueness of Tracking ID or Order Number.
- Auto-delete or age caps (including 90-day purge).
- Append/merge import (only replace).
- Filtered export (export is always the full live store).
- Undo after delete.
- Mobile layout as a goal (one desktop machine).
- Multi-user or concurrent-tab merge semantics beyond “last write in this browser.”

## Further Notes

Glossary is `CONTEXT.md`. Persistence and backup decisions are ADR-0001, ADR-0002, ADR-0003. “3 months / 100–200 per day” was a sizing estimate for choosing IndexedDB, not a product cap.
