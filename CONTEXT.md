# Tracking

A single-person log of daily packing and fulfillment work, kept on one machine, with no accounts.

## Language

**Record**:
One logged unit of work: a date, a tracking id, an order number, packed, and fulfilled. Date and tracking id are required. Order number may be empty. A Record can be edited or deleted after save. There is no duplicate action. Records stay until the user deletes them or replaces the whole set by import.
_Avoid_: row, entry, shipment, package

**Tracking ID**:
The carrier or platform identifier typed on a Record. It is not unique. Two Records may share the same tracking id.
_Avoid_: tracking number, AWB, barcode

**Order Number**:
The store or marketplace order identifier typed on a Record. It is not unique. Two Records may share the same order number.
_Avoid_: order id, PO, invoice

**Date**:
The calendar day a Record belongs to. On create it defaults to today; the user may type a different day. There is no age cap on Date.
_Avoid_: timestamp, created at, shipment date

**Today**:
The machine's local calendar date. The Today page and default Date both use this.
_Avoid_: UTC today, server date

**Packed**:
An independent boolean on a Record. Checking it does not imply fulfilled.
_Avoid_: packed status, packing state

**Fulfilled**:
An independent boolean on a Record. Checking it does not imply packed.
_Avoid_: shipped, completed, done
