# 02 — Edit, check Packed/Fulfilled, and delete a Record

**What to build:** On Today, the operator can change every field of an existing Record, toggle Packed and Fulfilled independently on the row, and delete a Record after confirm. There is no duplicate action.

**Blocked by:** 01 — Create a Record and see it persist on Today

**Status:** ready-for-agent

- [x] Every field (Date, Tracking ID, Order Number, Packed, Fulfilled) can be edited after save
- [x] Packed and Fulfilled are independent checkboxes; toggling one does not change the other
- [x] Delete asks for confirmation; cancelling leaves the Record; confirming removes it from the table and from the store
- [x] Reload after edit or delete shows the new state
- [x] Missing Tracking ID or Date on edit is rejected the same as on create
- [x] Store tests cover update, independent booleans, delete, and rejected invalid update through the in-memory adapter
