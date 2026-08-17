# 01 — Create a Record and see it persist on Today

**What to build:** The operator opens the app with no login, lands on Today, adds a Record (Date defaulting to today, Tracking ID required, Order Number optional, Packed and Fulfilled unchecked), sees it in today’s table, and still sees it after a full reload.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] Next.js app deploys as a static Vercel-ready client app with no API routes, auth, or env secrets
- [x] Record store seam exists (create + list with a date filter) with IndexedDB in the app and in-memory for tests
- [x] Today page: add a Record; Date defaults to today (local calendar); Date can be overridden on create
- [x] Save with empty Tracking ID or empty Date is rejected on the form; empty Order Number is allowed
- [x] Two Records may share the same Tracking ID or Order Number
- [x] A Record whose Date is today appears in today’s table; a Record dated yesterday does not
- [x] Reload keeps the Records
- [x] Header nav includes Today (All Records may be a stub until ticket 04)
- [x] Quota-full write surfaces a storage-full error and does not pretend the save worked
- [x] Store tests cover create, validation, non-uniqueness, and list-by-date through the in-memory adapter
