"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FoldersPage() {
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [assets, setAssets] = useState<any[]>([]);

  async function loadFolders() {
    const response = await fetch("/api/folders");
    const payload = await response.json();
    if (payload.ok) {
      setFolders(payload.data);
      if (!selectedFolder && payload.data.length) setSelectedFolder(payload.data[0].folderPath);
    }
  }

  async function loadAssets(folderPath: string) {
    if (!folderPath) return;
    const response = await fetch(`/api/assets?limit=48&sort=newest&folderPath=${encodeURIComponent(folderPath)}`);
    const payload = await response.json();
    if (payload.ok) setAssets(payload.data.items);
  }

  useEffect(() => { loadFolders(); }, []);
  useEffect(() => { if (selectedFolder) loadAssets(selectedFolder); }, [selectedFolder]);

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="p-4">
        <h2 className="text-xl font-semibold">Uploaded Folders</h2>
        <p className="mt-2 text-sm text-muted-foreground">Browse imported folder groups and preview the images inside each one.</p>
        <div className="mt-4 space-y-3">
          <select value={selectedFolder} onChange={(event) => setSelectedFolder(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary">
            {folders.map((folder) => <option key={folder.folderPath} value={folder.folderPath}>{folder.folderPath}</option>)}
          </select>
          <div className="space-y-2">
            {folders.map((folder) => (
              <button key={folder.folderPath} className={`w-full rounded-xl border p-3 text-left ${selectedFolder === folder.folderPath ? "border-primary bg-primary/10" : "border-white/10 bg-white/[0.03]"}`} onClick={() => setSelectedFolder(folder.folderPath)}>
                <div className="truncate font-medium text-white">{folder.folderPath}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge>{folder.count} assets</Badge>
                  <Badge>{new Date(folder.latestImportedAt).toLocaleDateString()}</Badge>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">{selectedFolder || "Choose a folder"}</h3>
            <p className="text-sm text-muted-foreground">Click any image to open its generated preview in a new tab.</p>
          </div>
          {selectedFolder ? <Link href={`/?folderPath=${encodeURIComponent(selectedFolder)}`} className="text-sm text-primary">Open in library</Link> : null}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {assets.map((asset) => (
            <a key={asset.id} href={`/api/media/${asset.id}/preview`} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05]">
              <div className="aspect-square overflow-hidden bg-black/40">
                <img src={`/api/media/${asset.id}/thumb`} alt={asset.displayName} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </div>
              <div className="p-3 text-xs text-muted-foreground">
                <div className="truncate font-medium text-white">{asset.displayName}</div>
                <div className="mt-1 truncate">{asset.originalFilename}</div>
              </div>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}