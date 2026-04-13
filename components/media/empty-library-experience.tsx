"use client";

import { useRef, useState } from "react";
import { Sparkles, Upload, FolderOpen, Keyboard, Image as ImageIcon, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const onboardingCards = [
  {
    title: "Drop a folder or a batch",
    body: "Drag a folder selection or a stack of Midjourney exports here. PixelDeck stages the files, then the worker handles hashing, metadata, thumbnails, and duplicate prevention.",
    icon: FolderOpen,
  },
  {
    title: "Browse without lag",
    body: "The gallery uses virtualized rendering and serves thumbnails instead of originals, so very large libraries stay fast on consumer hardware.",
    icon: ImageIcon,
  },
  {
    title: "Handle mixed media",
    body: "Image previews, video poster frames, lightweight preview clips, tags, collections, and batch actions all work from the same library model.",
    icon: Video,
  },
];

const shortcutHints = [
  "/ search",
  "g grid view",
  "l list view",
  "Esc close drawer",
  "Ctrl/Cmd+A select visible",
  "Shift+Click range select",
];

export function EmptyLibraryExperience({ onImported }: { onImported: () => Promise<void> | void }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);

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
      await onImported();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[28px] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-slate-900/90 to-orange-400/10 p-6 shadow-2xl shadow-cyan-950/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_28%),radial-gradient(circle_at_left,rgba(34,211,238,0.16),transparent_28%)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <Badge className="mb-3 bg-cyan-400/15 text-cyan-100">First-run workspace</Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-white">Build your visual command deck from an empty folder to a high-volume library.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Start by dropping assets or choosing a folder. PixelDeck stages uploads into the import pipeline, then the worker generates thumbnails, previews, posters, hashes, and search entries in the background.
            </p>
          </div>
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-300" /> Local-first storage with immutable originals</div>
            <div className="flex items-center gap-2"><Upload className="h-4 w-4 text-orange-300" /> Batch import from drag-and-drop or folder picker</div>
            <div className="flex items-center gap-2"><Keyboard className="h-4 w-4 text-emerald-300" /> Keyboard-first browsing once the library fills in</div>
          </div>
        </div>
      </div>

      <div
        className={`group relative overflow-hidden rounded-[32px] border p-8 transition ${dragActive ? "border-cyan-300 bg-cyan-400/10 shadow-[0_0_80px_rgba(34,211,238,0.16)]" : "border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 hover:border-cyan-400/30"}`}
        onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (event.dataTransfer.files?.length) submitFiles(event.dataTransfer.files);
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px] opacity-60" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-200">
            <Upload className="h-9 w-9" />
          </div>
          <h3 className="text-2xl font-semibold text-white">Drag and drop images or videos to start your first import</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Folder selection works too. Files are uploaded into PixelDeck staging storage, then queued as an import job so the UI stays responsive while processing runs in the worker.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button disabled={importing} onClick={() => fileInputRef.current?.click()} className="min-w-40">{importing ? "Uploading..." : "Import Folder"}</Button>
            <Button variant="secondary" disabled={importing} onClick={() => fileInputRef.current?.click()}>Choose Files</Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.target.files?.length) submitFiles(event.target.files);
            }}
            {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 md:grid-cols-3">
          {onboardingCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="h-full border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-cyan-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="text-base font-semibold text-white">{card.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-400">{card.body}</p>
              </Card>
            );
          })}
        </div>
        <Card className="border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2 text-white">
            <Keyboard className="h-4 w-4 text-cyan-200" />
            <h4 className="text-base font-semibold">Shortcut hints</h4>
          </div>
          <div className="space-y-2">
            {shortcutHints.map((hint) => (
              <div key={hint} className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-slate-300">
                <span>{hint.split(" ")[0]}</span>
                <span className="text-slate-500">{hint.substring(hint.indexOf(" ") + 1)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
