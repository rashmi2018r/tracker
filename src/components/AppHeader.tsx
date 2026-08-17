"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { StorageFullError, UnreadableImportError, localToday } from "@/records";
import { useRecordStore } from "./RecordStoreProvider";

export function AppHeader() {
  const pathname = usePathname();
  const { store, notifyChange } = useRecordStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onExport() {
    setError(null);
    const bytes = await store.exportAll();
    const blob = new Blob([bytes as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tracking-${localToday()}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function onImportFile(file: File) {
    setMessage(null);
    setError(null);
    const confirmed = window.confirm(
      "This file will replace every Record in the live store. Continue?",
    );
    if (!confirmed) {
      return;
    }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const result = await store.importReplace(bytes);
      setMessage(`Imported ${result.loaded} Records, skipped ${result.skipped}.`);
      notifyChange();
    } catch (caught) {
      if (caught instanceof UnreadableImportError) {
        setError(caught.message);
      } else if (caught instanceof StorageFullError) {
        setError(caught.message);
      } else {
        setError("Import failed.");
      }
    }
  }

  return (
    <>
      <header className="app-header">
        <div className="brand">Tracking</div>
        <nav className="nav">
          <Link className={pathname === "/" ? "active" : ""} href="/">
            Today
          </Link>
          <Link
            className={pathname === "/all-records" ? "active" : ""}
            href="/all-records"
          >
            All Records
          </Link>
        </nav>
        <div className="header-actions">
          <button type="button" className="secondary" onClick={() => void onExport()}>
            Export
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => fileInput.current?.click()}
          >
            Import
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) {
                void onImportFile(file);
              }
            }}
          />
        </div>
      </header>
      {error ? <div className="banner error">{error}</div> : null}
      {message ? <div className="banner ok">{message}</div> : null}
    </>
  );
}
