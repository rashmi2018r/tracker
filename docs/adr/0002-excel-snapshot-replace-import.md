# Excel files are full-store backups; import replaces

The user needs a file they can keep on disk as the backup of the live store. Export writes one `.xlsx` snapshot of every Record currently in IndexedDB. Import replaces the entire live store with that file after confirmation — append would duplicate rows because Tracking ID is not unique, and a second “merge” button is two products. Excel is not the live database; IndexedDB is.
