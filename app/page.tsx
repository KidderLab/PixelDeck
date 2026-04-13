import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AssetWorkspace } from "@/components/media/asset-workspace";

export default function HomePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading library...</div>}>
        <AssetWorkspace />
      </Suspense>
    </AppShell>
  );
}
