"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SettingsPanel() {
  const [payload, setPayload] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" }).then((response) => response.json()).then(setPayload);
  }, []);

  const worker = payload?.data?.worker;
  const storage = payload?.data?.storage;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Card className="p-6">
        <h2 className="text-xl font-semibold">Storage locations</h2>
        <p className="mt-2 text-sm text-muted-foreground">PixelDeck keeps originals immutable and stores derived files in dedicated folders. Move storage to another drive with <code>scripts/move-storage-to-drive.ps1</code>.</p>
        {!storage ? (
          <div className="mt-4 text-sm text-muted-foreground">Loading storage settings...</div>
        ) : (
          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Database</div>
              <div className="mt-2 break-all text-white">{storage.database}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Storage root</div>
              <div className="mt-2 break-all text-white">{storage.storageRoot}</div>
            </div>
            {[
              ["Imports", storage.imports],
              ["Originals", storage.originals],
              ["Thumbnails", storage.thumbs],
              ["Previews", storage.previews],
              ["Video posters", storage.posters],
              ["ZIP exports", storage.zips],
              ["Logs", storage.logs]
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
                <div className="mt-2 break-all text-white">{value}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <div className="grid gap-4">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Worker status</h2>
          {!worker ? (
            <div className="mt-4 text-sm text-muted-foreground">Loading worker status...</div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{worker.pendingImports} pending imports</Badge>
              <Badge>{worker.runningImports} running imports</Badge>
              <Badge>{worker.pendingExports} pending exports</Badge>
              <Badge>{worker.runningExports} running exports</Badge>
            </div>
          )}
        </Card>
        <Card className="p-6">
          <h2 className="text-xl font-semibold">App settings</h2>
          <pre className="mt-4 overflow-auto rounded-xl bg-black/40 p-4 text-sm text-muted-foreground">{JSON.stringify(payload?.data?.settings ?? [], null, 2)}</pre>
        </Card>
      </div>
    </div>
  );
}
