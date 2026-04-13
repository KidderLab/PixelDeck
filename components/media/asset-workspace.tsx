"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MediaGrid } from "@/components/media/media-grid";
import { AssetTableView } from "@/components/media/asset-table-view";
import { DetailDrawer } from "@/components/media/detail-drawer";
import { EmptyLibraryExperience } from "@/components/media/empty-library-experience";
import { selectionReducer, initialSelectionState } from "@/lib/selection";

export interface AssetRecord {
  id: string;
  displayName: string;
  originalFilename: string;
  mediaType: "IMAGE" | "VIDEO";
  thumbnailPath: string | null;
  previewPath: string | null;
  posterPath: string | null;
  width: number | null;
  height: number | null;
  durationMs?: number | null;
  favorite: boolean;
  archived: boolean;
  importedAt: string;
  capturedAt?: string | null;
  generationDate?: string | null;
  source: string;
  extension: string;
  tags: Array<{ tag: { id: string; name: string } }>;
}

type SortMode = "newest" | "oldest" | "name";
type DateField = "importedAt" | "capturedAt" | "generationDate";
type DatePreset = "all" | "7d" | "30d" | "180d" | "365d" | "custom";
type Density = "small" | "medium" | "large";

function dedupeAssets(items: AssetRecord[]) {
  return items.filter((item, index, array) => index === array.findIndex((candidate) => candidate.id === item.id));
}

export function AssetWorkspace() {
  const [items, setItems] = useState<AssetRecord[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const initialFolderPath = searchParams.get("folderPath") ?? "";
  const [query, setQuery] = useState("");
  const [folderPath, setFolderPath] = useState(initialFolderPath);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [selection, dispatch] = useReducer(selectionReducer, initialSelectionState);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sort, setSort] = useState<SortMode>("newest");
  const [dateField, setDateField] = useState<DateField>("importedAt");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [density, setDensity] = useState<Density>("medium");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadedCursorsRef = useRef<Set<string>>(new Set());
  const inFlightCursorRef = useRef<string | null>(null);

  async function load(reset = false) {
    const activeCursor = reset ? null : cursor;
    if (!reset) {
      if (!activeCursor) return;
      if (inFlightCursorRef.current === activeCursor || loadedCursorsRef.current.has(activeCursor)) return;
      inFlightCursorRef.current = activeCursor;
      setIsLoadingMore(true);
    } else {
      loadedCursorsRef.current.clear();
      inFlightCursorRef.current = null;
      setIsLoading(true);
    }

    const params = new URLSearchParams({ limit: "60", sort, dateField, datePreset });
    if (folderPath) params.set("folderPath", folderPath);
    if (query) params.set("q", query);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (activeCursor) params.set("cursor", activeCursor);

    try {
      const response = await fetch(`/api/assets?${params.toString()}`);
      const payload = await response.json();
      if (!payload.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Failed to load assets");
      setTotalItems(payload.data.total ?? 0);
      setItems((current) => dedupeAssets(reset ? payload.data.items : [...current, ...payload.data.items]));
      if (activeCursor) loadedCursorsRef.current.add(activeCursor);
      setCursor(payload.data.nextCursor);
    } finally {
      if (reset) {
        setIsLoading(false);
      } else {
        inFlightCursorRef.current = null;
        setIsLoadingMore(false);
      }
    }
  }

  async function submitFiles(files: FileList | File[]) {
    const normalized = Array.from(files).filter((file) => file.size > 0);
    if (!normalized.length) {
      toast.error("No supported files were selected.");
      return;
    }

    const formData = new FormData();
    formData.set("source", "browser-upload");
    normalized.forEach((file) => formData.append("files", file, file.webkitRelativePath || file.name));

    setImporting(true);
    try {
      const response = await fetch("/api/imports/upload", { method: "POST", body: formData });
      const payload = await response.json();
      if (!payload.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Upload failed");
      toast.success(`Queued import job with ${payload.data.uploadedCount} file${payload.data.uploadedCount === 1 ? "" : "s"}.`);
      await load(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  useEffect(() => {
    load(true).catch((error) => toast.error(error.message));
  }, [sort, dateField, datePreset]);

  const selectedIds = useMemo(() => new Set(selection.ids), [selection.ids]);
  const isEmpty = !isLoading && items.length === 0 && !query;
  const showCustomDates = datePreset === "custom";
  const hasMore = Boolean(cursor);

  function applySelection(id: string, event?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }) {
    const orderedIds = items.map((item) => item.id);
    const clickedIndex = orderedIds.indexOf(id);
    if (clickedIndex < 0) return;

    if (event?.shiftKey && selection.anchorId) {
      const anchorIndex = orderedIds.indexOf(selection.anchorId);
      if (anchorIndex >= 0) {
        const [start, end] = anchorIndex < clickedIndex ? [anchorIndex, clickedIndex] : [clickedIndex, anchorIndex];
        const rangeIds = orderedIds.slice(start, end + 1);
        const next = event.ctrlKey || event.metaKey ? [...new Set([...selection.ids, ...rangeIds])] : rangeIds;
        dispatch({ type: "replace", ids: next, anchorId: selection.anchorId });
        return;
      }
    }

    if (event?.ctrlKey || event?.metaKey) {
      dispatch({ type: "toggle", id });
      return;
    }

    dispatch({ type: "replace", ids: [id], anchorId: id });
  }

  async function bulk(action: string) {
    if (!selection.ids.length) return;
    const response = await fetch("/api/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, assetIds: selection.ids }) });
    const payload = await response.json();
    if (!payload.ok) return toast.error("Bulk action failed");
    toast.success(`Updated ${selection.ids.length} assets`);
    dispatch({ type: "clear" });
    load(true).catch((error) => toast.error(error.message));
  }

  async function exportSelection() {
    if (!selection.ids.length) return;
    setExporting(true);
    try {
      const response = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetIds: selection.ids, name: `pixeldeck-export-${Date.now()}` })
      });
      const payload = await response.json();
      if (!payload.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Failed to queue export");
      const jobId = payload.data.id;
      toast.success("ZIP export queued. Building archive...");

      for (let attempt = 0; attempt < 60; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const statusResponse = await fetch(`/api/exports/${jobId}`);
        const statusPayload = await statusResponse.json();
        if (!statusPayload.ok) continue;
        if (statusPayload.data.status === "COMPLETED") {
          window.location.href = `/api/exports/${jobId}/download`;
          toast.success("ZIP export ready. Download started.");
          return;
        }
        if (statusPayload.data.status === "FAILED") {
          throw new Error(statusPayload.data.errorMessage ?? "Export failed");
        }
      }

      toast.message("Export is still processing. Keep the worker running and try again shortly.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <Card className="h-fit p-4">
        <div className="space-y-4">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Search</div>
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="filename, prompt, tags, source" onKeyDown={(event) => { if (event.key === "Enter") load(true).catch((error) => toast.error(error.message)); }} />
          </div>
          <div className="grid gap-3">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Date Field</div>
              <select value={dateField} onChange={(event) => setDateField(event.target.value as DateField)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="importedAt">Import date</option>
                <option value="capturedAt">Image creation date</option>
                <option value="generationDate">Generation date</option>
              </select>
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Date Range</div>
              <select value={datePreset} onChange={(event) => setDatePreset(event.target.value as DatePreset)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="all">All time</option>
                <option value="7d">Last week</option>
                <option value="30d">Last month</option>
                <option value="180d">Last 6 months</option>
                <option value="365d">Last 12 months</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
            {showCustomDates ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Start</div>
                  <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">End</div>
                  <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
              </div>
            ) : null}
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Sort</div>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => load(true).catch((error) => toast.error(error.message))}>Run</Button>
            <Button className="flex-1" variant="secondary" onClick={() => { setQuery(""); setCursor(null); setDateField("importedAt"); setDatePreset("all"); setStartDate(""); setEndDate(""); setSort("newest"); setFolderPath(initialFolderPath); load(true).catch((error) => toast.error(error.message)); }}>Reset</Button>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>Total items in current library view: <span className="text-white">{totalItems}</span></div>
            <div>Click a thumbnail to select it.</div>
            <div>Use Ctrl/Cmd-click to toggle and Shift-click to select a range.</div>
            <div>Videos stay lightweight in the grid: PixelDeck shows poster thumbnails and only loads a preview clip when you open the detail drawer.</div>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        {isEmpty ? (
          <EmptyLibraryExperience onImported={() => load(true)} />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant={view === "grid" ? "default" : "secondary"} onClick={() => setView("grid")}>Grid</Button>
                <Button variant={view === "table" ? "default" : "secondary"} onClick={() => setView("table")}>Table</Button>
                <Badge>{totalItems} total</Badge>
                <Badge>{items.length} loaded</Badge>
                {folderPath ? <Badge className="bg-cyan-500/15 text-cyan-200">Folder: {folderPath}</Badge> : null}
                <Badge>{selection.ids.length} selected</Badge>
                {hasMore ? <Badge className="bg-white/10 text-white/80">Infinite scroll on</Badge> : <Badge className="bg-emerald-500/15 text-emerald-200">End reached</Badge>}
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                  <Button variant={density === "small" ? "default" : "ghost"} className="px-3 py-1.5 text-xs" onClick={() => setDensity("small")}>Small</Button>
                  <Button variant={density === "medium" ? "default" : "ghost"} className="px-3 py-1.5 text-xs" onClick={() => setDensity("medium")}>Medium</Button>
                  <Button variant={density === "large" ? "default" : "ghost"} className="px-3 py-1.5 text-xs" onClick={() => setDensity("large")}>Large</Button>
                </div>
                <Button variant="secondary" disabled={importing} onClick={() => fileInputRef.current?.click()}>{importing ? "Uploading..." : "Import Folder"}</Button>
                <Button variant="secondary" onClick={() => dispatch({ type: "replace", ids: items.map((item) => item.id), anchorId: items[0]?.id ?? null })}>Select Visible</Button>
                <Button variant="secondary" onClick={() => bulk("favorite")}>Favorite</Button>
                <Button variant="secondary" onClick={() => bulk("archive")}>Archive</Button>
                <Button onClick={() => exportSelection()} disabled={!selection.ids.length || exporting}>{exporting ? "Building ZIP..." : "Export ZIP"}</Button>
                <Button variant="ghost" onClick={() => dispatch({ type: "clear" })}>Clear</Button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files?.length) void submitFiles(event.target.files);
              }}
              {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
            />

            {view === "grid" ? (
              <MediaGrid items={items} density={density} hasMore={hasMore} isLoadingMore={isLoadingMore} selectedIds={selectedIds} onSelect={applySelection} onOpen={setDetailId} onLoadMore={() => load(false).catch((error) => toast.error(error.message))} />
            ) : (
              <AssetTableView items={items} selectedIds={selectedIds} onSelect={applySelection} onOpen={setDetailId} />
            )}
          </>
        )}
      </Card>
      <DetailDrawer assetId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
