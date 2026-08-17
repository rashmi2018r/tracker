# IndexedDB is the live store; there is no server database

This app is a single-person tool on one machine, deployed to Vercel with no accounts. Vercel’s filesystem is ephemeral and a hosted DB (or Blob) would make a public URL writable by anyone. Live Records therefore live in the browser’s IndexedDB, not localStorage (too small for this volume) and not a Vercel/Marketplace database.
