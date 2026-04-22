"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCleanAssetDisplayName } from "@/lib/display-name";

function formatDuration(durationMs?: number | null) {
  if (!durationMs || durationMs <= 0) return "-";
  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function DetailDrawer({ assetId, onClose, onRemoved }: { assetId: string | null; onClose: () => void; onRemoved?: (assetId: string) => void }) {
  const [asset, setAsset] = useState<any>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    setAsset(null);
    if (!assetId) return;
    fetch(`/api/assets/${assetId}`).then((response) => response.json()).then((payload) => {
      if (payload.ok) setAsset(payload.data);
    });
  }, [assetId]);

  if (!assetId) return null;

  async function removeAsset() {
    if (!assetId || removing) return;
    const confirmed = window.confirm("Remove this item from the library?");
    if (!confirmed) return;

    setRemoving(true);
    try {
      const response = await fetch("/api/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", assetIds: [assetId] })
      });
      const payload = await response.json();
      if (!payload.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Remove failed");
      toast.success("Item removed from the library.");
      onRemoved?.(assetId);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Remove failed");
    } finally {
      setRemoving(false);
    }
  }

  const isVideo = asset?.mediaType === "VIDEO";
  const cleanName = asset ? getCleanAssetDisplayName(asset.displayName, asset.originalFilename) : "";

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-white/10 bg-black/80 p-4 backdrop-blur md:w-[480px]">
      <Card className="flex h-full flex-col p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Asset details</h2>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => removeAsset()} disabled={removing}>{removing ? "Removing..." : "Remove"}</Button>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>
        {!asset ? <div className="text-sm text-muted-foreground">Loading...</div> : (
          <div className="space-y-4 overflow-auto">
            <div className="overflow-hidden rounded-xl bg-black/40">
              {isVideo ? (
                <video src={`/api/media/${asset.id}/preview`} poster={`/api/media/${asset.id}/poster`} controls preload="metadata" className="w-full bg-black" />
              ) : (
                <img src={`/api/media/${asset.id}/preview`} alt={cleanName} className="w-full object-cover" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-xl font-semibold">{cleanName}</div>
                {isVideo ? <Badge className="bg-black/70 text-white">Video</Badge> : null}
              </div>
              <div className="text-sm text-muted-foreground">Original file: {asset.originalFilename}</div>
              {asset.originalPath ? <div className="mt-1 break-all text-xs text-muted-foreground">Stored at: {asset.originalPath}</div> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {asset.tags.map((tag: any) => <Badge key={tag.tag.id}>{tag.tag.name}</Badge>)}
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Type</dt><dd>{asset.mediaType}</dd></div>
              <div><dt className="text-muted-foreground">Source</dt><dd>{asset.source}</dd></div>
              <div><dt className="text-muted-foreground">Resolution</dt><dd>{asset.width ?? "?"} x {asset.height ?? "?"}</dd></div>
              <div><dt className="text-muted-foreground">Duration</dt><dd>{formatDuration(asset.durationMs)}</dd></div>
              <div><dt className="text-muted-foreground">Hash</dt><dd className="truncate">{asset.sha256}</dd></div>
              <div><dt className="text-muted-foreground">Imported</dt><dd>{new Date(asset.importedAt).toLocaleString()}</dd></div>
            </dl>
            <pre className="overflow-auto rounded-xl bg-black/40 p-3 text-xs text-muted-foreground">{JSON.stringify(asset.metadataJson, null, 2)}</pre>
          </div>
        )}
      </Card>
    </div>
  );
}
