"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type DuplicateEvent = {
  id: string;
  attemptedFilename: string;
  attemptedPath: string;
  existingAssetId: string;
  existingDisplayName: string;
  existingOriginalFilename: string;
  createdAt: string;
};

type ImportJob = {
  id: string;
  sourceFolder: string;
  source: string;
  status: string;
  totalDiscovered: number;
  processedCount: number;
  duplicateCount: number;
  failedCount: number;
  skippedCount: number;
  createdAt: string;
  updatedAt: string;
  lastProcessedAt: string | null;
  duplicateEvents?: DuplicateEvent[];
};

function getFolderLabel(folderPath: string) {
  if (!folderPath) return "Unknown folder";
  const normalized = folderPath.replace(/[/\\]+$/, "").split(/[/\\]+/).filter(Boolean);
  return normalized[normalized.length - 1] ?? folderPath;
}

export function ImportHistoryPage() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<ImportJob | null>(null);
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/imports", { cache: "no-store" });
    const payload = await response.json();
    if (!payload.ok) return;

    const nextJobs = payload.data as ImportJob[];
    setJobs(nextJobs);
    setSelectedJobId((current) => {
      if (!current) return nextJobs[0]?.id ?? null;
      return nextJobs.some((job) => job.id === current) ? current : nextJobs[0]?.id ?? null;
    });
  }, []);

  const openJob = useCallback(async (id: string) => {
    const response = await fetch(`/api/imports/${id}`, { cache: "no-store" });
    const payload = await response.json();
    if (payload.ok) {
      setSelectedJobId(id);
      setSelectedJob(payload.data);
    }
  }, []);

  const cancelJob = useCallback(async (job: ImportJob) => {
    if (cancellingJobId) return;
    const confirmed = window.confirm(`Cancel import for "${getFolderLabel(job.sourceFolder)}"?`);
    if (!confirmed) return;

    setCancellingJobId(job.id);
    try {
      const response = await fetch(`/api/imports/${job.id}`, {
        method: "POST",
        cache: "no-store"
      });
      const payload = await response.json();
      if (!payload.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Cancel failed");
      }

      toast.success("Import cancelled.");
      await load();
      await openJob(job.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cancel failed");
    } finally {
      setCancellingJobId(null);
    }
  }, [cancellingJobId, load, openJob]);

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 5000);
    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!selectedJobId) {
      setSelectedJob(null);
      return;
    }

    void openJob(selectedJobId);
    const interval = window.setInterval(() => {
      void openJob(selectedJobId);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [openJob, selectedJobId]);

  const activeSummary = useMemo(() => {
    const running = jobs.filter((job) => job.status === "RUNNING").length;
    const pending = jobs.filter((job) => job.status === "PENDING").length;
    const completed = jobs.filter((job) => job.status === "COMPLETED").length;
    const cancelled = jobs.filter((job) => job.status === "CANCELLED").length;
    return { running, pending, completed, cancelled };
  }, [jobs]);

  return (
    <div className="grid gap-4 lg:grid-cols-[400px_minmax(0,1fr)]">
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Import History</h2>
            <p className="mt-2 text-sm text-muted-foreground">Recent folder imports, live statuses, duplicates, skipped files, and failures.</p>
          </div>
          <Button variant="secondary" onClick={() => void load()}>Refresh</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Badge>{activeSummary.running} running</Badge>
          <Badge>{activeSummary.pending} pending</Badge>
          <Badge>{activeSummary.completed} completed</Badge>
          <Badge>{activeSummary.cancelled} cancelled</Badge>
        </div>
        <div className="mt-4 space-y-3">
          {jobs.map((job) => {
            const folderLabel = getFolderLabel(job.sourceFolder);
            const isActive = selectedJobId === job.id;
            const canCancel = job.status === "PENDING" || job.status === "RUNNING";
            return (
              <div
                key={job.id}
                className={`rounded-2xl border p-4 transition ${isActive ? "border-cyan-400/40 bg-cyan-500/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"}`}
              >
                <button type="button" className="w-full text-left" onClick={() => void openJob(job.id)}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-white">{folderLabel}</div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">{job.sourceFolder}</div>
                    </div>
                    <Badge>{job.status}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Badge>{job.totalDiscovered} found</Badge>
                    <Badge>{job.processedCount} processed</Badge>
                    <Badge>{job.duplicateCount} duplicates</Badge>
                    <Badge>{job.skippedCount} skipped</Badge>
                    <Badge>{job.failedCount} failed</Badge>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Source label: <span className="text-white/80">{job.source}</span>
                  </div>
                </button>
                {canCancel ? (
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="secondary"
                      disabled={cancellingJobId === job.id}
                      onClick={() => void cancelJob(job)}
                    >
                      {cancellingJobId === job.id ? "Cancelling..." : "Cancel import"}
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>
      <Card className="p-4">
        {!selectedJob ? (
          <div className="text-sm text-muted-foreground">Select an import job.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{getFolderLabel(selectedJob.sourceFolder)}</h3>
                <p className="text-sm text-muted-foreground">{selectedJob.sourceFolder}</p>
                <p className="mt-1 text-xs text-muted-foreground">Source label: {selectedJob.source}</p>
              </div>
              <div className="flex items-center gap-2">
                {(selectedJob.status === "PENDING" || selectedJob.status === "RUNNING") ? (
                  <Button
                    variant="secondary"
                    disabled={cancellingJobId === selectedJob.id}
                    onClick={() => void cancelJob(selectedJob)}
                  >
                    {cancellingJobId === selectedJob.id ? "Cancelling..." : "Cancel import"}
                  </Button>
                ) : null}
                <Button variant="secondary" onClick={() => void openJob(selectedJob.id)}>Refresh</Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge>{selectedJob.status}</Badge>
              <Badge>{selectedJob.totalDiscovered} discovered</Badge>
              <Badge>{selectedJob.processedCount} processed</Badge>
              <Badge>{selectedJob.duplicateCount} duplicates</Badge>
              <Badge>{selectedJob.skippedCount} skipped</Badge>
              <Badge>{selectedJob.failedCount} failed</Badge>
            </div>
            <div>
              <h4 className="mb-3 text-base font-semibold">Attempted imports that matched existing assets</h4>
              <div className="space-y-3">
                {(() => {
                  const duplicateEvents = selectedJob.duplicateEvents ?? [];
                  if (duplicateEvents.length === 0) {
                    return <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-muted-foreground">No duplicate matches recorded for this import job yet.</div>;
                  }

                  return duplicateEvents.map((event) => (
                    <div key={event.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="font-medium text-white">Attempted: {event.attemptedFilename}</div>
                      <div className="mt-1 text-sm text-muted-foreground">Path: {event.attemptedPath}</div>
                      <div className="mt-2 text-sm text-cyan-200">Matched existing asset: {event.existingDisplayName}</div>
                      <div className="text-xs text-muted-foreground">Existing original file: {event.existingOriginalFilename}</div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
