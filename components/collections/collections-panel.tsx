"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CollectionsPanel() {
  const [collections, setCollections] = useState<any[]>([]);
  const [name, setName] = useState("");

  async function load() {
    const response = await fetch("/api/collections");
    const payload = await response.json();
    if (payload.ok) setCollections(payload.data);
  }

  async function createCollection() {
    const response = await fetch("/api/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const payload = await response.json();
    if (!payload.ok) return toast.error("Failed to create collection");
    setName("");
    toast.success("Collection created");
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold">Collections</h2>
      <div className="mt-4 flex gap-2">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="New collection name" />
        <Button onClick={createCollection}>Create</Button>
      </div>
      <div className="mt-6 space-y-3">
        {collections.map((collection) => (
          <div key={collection.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="font-medium">{collection.name}</div>
            <div className="text-sm text-muted-foreground">{collection._count.assets} assets</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
