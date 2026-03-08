"use client";

import { useState, useRef } from "react";
import { Download, Upload, FileJson, FileSpreadsheet, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { useKeyStore } from "@/features/auth/key-store";
import {
  exportNotes,
  exportTasks,
  exportTrips,
  exportAll,
  downloadNotesJson,
  downloadTasksJson,
  downloadTasksCsv,
  downloadTripsJson,
  downloadAllJson,
  importNotes,
  importTasks,
  importTrips,
} from "@/lib/export-import";
import type { ExportBundle } from "@/lib/export-import";

type ExportStatus = "idle" | "loading" | "done" | "error";
type ImportStatus = "idle" | "loading" | "done" | "error";

export default function SettingsPage() {
  const { masterKey } = useKeyStore();
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const [importMessage, setImportMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExportAll() {
    setExportStatus("loading");
    try {
      const bundle = await exportAll();
      downloadAllJson(bundle);
      setExportStatus("done");
    } catch {
      setExportStatus("error");
    }
  }

  async function handleExportNotes() {
    setExportStatus("loading");
    try {
      const notes = await exportNotes();
      downloadNotesJson(notes);
      setExportStatus("done");
    } catch {
      setExportStatus("error");
    }
  }

  async function handleExportTasksJson() {
    setExportStatus("loading");
    try {
      const tasks = await exportTasks();
      downloadTasksJson(tasks);
      setExportStatus("done");
    } catch {
      setExportStatus("error");
    }
  }

  async function handleExportTasksCsv() {
    setExportStatus("loading");
    try {
      const tasks = await exportTasks();
      downloadTasksCsv(tasks);
      setExportStatus("done");
    } catch {
      setExportStatus("error");
    }
  }

  async function handleExportTrips() {
    setExportStatus("loading");
    try {
      const trips = await exportTrips();
      downloadTripsJson(trips);
      setExportStatus("done");
    } catch {
      setExportStatus("error");
    }
  }

  function handleImportClick() {
    fileRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus("loading");
    setImportMessage("");

    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportBundle | Record<string, unknown>;

      let count = 0;

      // Normalise subtasks: accept string[] as well as {id,title,completed}[]
      function normalizeSubtasks(raw: unknown): Array<{ id: string; title: string; completed: boolean }> | undefined {
        if (!Array.isArray(raw)) return undefined;
        return raw.map((st: unknown, i: number) => {
          if (typeof st === "string") return { id: `st-${Date.now()}-${i}`, title: st, completed: false };
          return st as { id: string; title: string; completed: boolean };
        });
      }

      // Wrap single object into an array for uniform handling
      const items: Record<string, unknown>[] = Array.isArray(data)
        ? (data as Record<string, unknown>[])
        : "version" in (data as Record<string, unknown>) && (data as ExportBundle).version === 1
          ? [] // bundle handled below
          : [data as Record<string, unknown>];

      if ("version" in (data as Record<string, unknown>) && (data as ExportBundle).version === 1) {
        const bundle = data as ExportBundle;
        if (bundle.notes?.length) {
          await importNotes(bundle.notes);
          count += bundle.notes.length;
        }
        if (bundle.tasks?.length) {
          const tasks = bundle.tasks.map((t) => ({ ...t, subtasks: normalizeSubtasks(t.subtasks) }));
          await importTasks(tasks as Parameters<typeof importTasks>[0]);
          count += bundle.tasks.length;
        }
        if (bundle.trips?.length) {
          await importTrips(bundle.trips);
          count += bundle.trips.length;
        }
      } else if (items.length > 0) {
        const sample = items[0]!;
        if ("content" in sample && "tags" in sample) {
          await importNotes(items as Parameters<typeof importNotes>[0]);
          count = items.length;
        } else if ("priority" in sample || "completed" in sample || "title" in sample) {
          const tasks = items.map((t) => ({ ...t, subtasks: normalizeSubtasks(t.subtasks) }));
          await importTasks(tasks as Parameters<typeof importTasks>[0]);
          count = items.length;
        } else if ("destination" in sample && "startDate" in sample) {
          await importTrips(items as Parameters<typeof importTrips>[0]);
          count = items.length;
        }
      }

      setImportMessage(`Imported ${count} item(s) successfully.`);
      setImportStatus("done");
    } catch {
      setImportMessage("Import failed. Please check the file format.");
      setImportStatus("error");
    }

    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="px-4 pt-6 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="h-8 w-8 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Encryption Status */}
      <section className="rounded-2xl border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">End-to-End Encryption</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {masterKey
            ? "Your data is encrypted at rest. The encryption key is managed automatically."
            : "Encryption key is loading. If this persists, try refreshing the page."}
        </p>
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${masterKey ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${masterKey ? "bg-green-500" : "bg-yellow-500"}`} />
          {masterKey ? "Active" : "Inactive"}
        </div>
      </section>

      {/* Export */}
      <section className="rounded-2xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Export Data</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Data is decrypted in your browser before download. Files never leave your device unencrypted.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleExportAll} disabled={exportStatus === "loading"} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-accent transition-colors">
            <FileJson className="h-4 w-4" />
            Export All
          </button>
          <button onClick={handleExportNotes} disabled={exportStatus === "loading"} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-accent transition-colors">
            <FileJson className="h-4 w-4" />
            Notes
          </button>
          <button onClick={handleExportTasksJson} disabled={exportStatus === "loading"} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-accent transition-colors">
            <FileJson className="h-4 w-4" />
            Tasks (JSON)
          </button>
          <button onClick={handleExportTasksCsv} disabled={exportStatus === "loading"} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-accent transition-colors">
            <FileSpreadsheet className="h-4 w-4" />
            Tasks (CSV)
          </button>
          <button onClick={handleExportTrips} disabled={exportStatus === "loading"} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-accent transition-colors">
            <FileJson className="h-4 w-4" />
            Trips
          </button>
        </div>
        {exportStatus === "loading" && <p className="text-xs text-muted-foreground">Exporting...</p>}
        {exportStatus === "done" && <p className="text-xs text-green-600 dark:text-green-400">Export complete!</p>}
        {exportStatus === "error" && <p className="text-xs text-red-500">Export failed.</p>}
      </section>

      {/* Import */}
      <section className="rounded-2xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Import Data</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload a JSON file exported from this app. Data will be encrypted before being saved.
        </p>
        <input ref={fileRef} type="file" accept=".json" onChange={handleFileSelected} className="hidden" />
        <button onClick={handleImportClick} disabled={importStatus === "loading"} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-accent transition-colors">
          <Upload className="h-4 w-4" />
          {importStatus === "loading" ? "Importing..." : "Choose file..."}
        </button>
        {importMessage && (
          <p className={`text-xs ${importStatus === "error" ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
            {importMessage}
          </p>
        )}
      </section>
    </div>
  );
}
