# Tracking ID and Order Number are not unique

A Record’s identity is an internal id, not Tracking ID or Order Number. The same tracking id or order number may appear on many Records. There is no duplicate action; the user creates, edits, or deletes. Enforcing uniqueness would reject real logs (two boxes, retries, typos) that this app is meant to accept.
