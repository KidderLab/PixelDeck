"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Badge } from "@/components/ui/badge";
import type { AssetRecord } from "@/components/media/asset-workspace";
import { getCleanAssetDisplayName } from "@/lib/display-name";

const GAP = 12;
const FOOTER_HEIGHT = 96;
const LOAD_MORE_THRESHOLD = 1200;

const densityConfig = {
  small: { minWidth: 150, metaHeight: 134, nameClass: "text-xs", metaClass: "text-[11px]", tagCount: 1 },
  medium: { minWidth: 210, metaHeight: 126, nameClass: "text-sm", metaClass: "text-xs", tagCount: 2 },
  large: { minWidth: 300, metaHeight: 118, nameClass: "text-sm", metaClass: "text-xs", tagCount: 2 }
} as const;

function getColumnCount(width: number, density: "small" | "medium" | "large") {
  const { minWidth } = densityConfig[density];
  return Math.max(1, Math.floor((width + GAP) / (minWidth + GAP)));
}

function formatDuration(durationMs?: number | null) {
  if (!durationMs || durationMs <= 0) return null;
  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function MediaGrid({ items, density, hasMore, isLoadingMore, selectedIds, onSelect, onOpen, onLoadMore }: { items: AssetRecord[]; density: "small" | "medium" | "large"; hasMore: boolean; isLoadingMore: boolean; selectedIds: Set<string>; onSelect: (id: string, event: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }) => void; onOpen: (id: string) => void; onLoadMore: () => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const update = () => setContainerWidth(element.clientWidth);
    update();

    const observer = new ResizeObserver(() => update());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const columnCount = useMemo(() => getColumnCount(containerWidth || 1200, density), [containerWidth, density]);
  const columnWidth = useMemo(() => {
    const width = Math.max(containerWidth - GAP * (columnCount - 1), columnCount * 120);
    return Math.floor(width / columnCount);
  }, [containerWidth, columnCount]);
  const rowHeight = useMemo(() => columnWidth + densityConfig[density].metaHeight, [columnWidth, density]);
  const rows = useMemo(() => {
    const grouped: AssetRecord[][] = [];
    for (let index = 0; index < items.length; index += columnCount) {
      grouped.push(items.slice(index, index + columnCount));
    }
    return grouped;
  }, [items, columnCount]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length + 1,
    getScrollElement: () => containerRef.current,
    estimateSize: (index) => index === rows.length ? FOOTER_HEIGHT : rowHeight,
    overscan: 5
  });

  function maybeLoadMore() {
    const element = containerRef.current;
    if (!element || !hasMore || isLoadingMore) return;
    const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (remaining <= LOAD_MORE_THRESHOLD) onLoadMore();
  }

  useEffect(() => {
    maybeLoadMore();
  }, [items.length, hasMore, isLoadingMore]);

  const config = densityConfig[density];

  return (
    <div ref={containerRef} onScroll={maybeLoadMore} className="h-[72vh] overflow-auto rounded-2xl border border-white/10 p-3">
      <div className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          if (virtualRow.index === rows.length) {
            return (
              <div key="footer" className="absolute left-0 top-0 flex w-full items-center justify-center" style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}>
                {isLoadingMore ? (
                  <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white">Loading more assets...</div>
                ) : hasMore ? (
                  <div className="text-sm text-muted-foreground">Scroll for more</div>
                ) : (
                  <div className="text-sm text-muted-foreground">You have reached the end of the loaded results.</div>
                )}
              </div>
            );
          }

          const row = rows[virtualRow.index] ?? [];
          return (
            <div key={`row-${virtualRow.index}`} className="absolute left-0 top-0 w-full" style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`, gap: `${GAP}px` }}>
                {row.map((item) => {
                  const cleanName = getCleanAssetDisplayName(item.displayName, item.originalFilename);
                  const isVideo = item.mediaType === "VIDEO";
                  const durationLabel = formatDuration(item.durationMs);
                  const previewSrc = isVideo ? `/api/media/${item.id}/poster` : `/api/media/${item.id}/thumb`;
                  return (
                    <div key={item.id} className={`overflow-hidden rounded-2xl border transition ${selectedIds.has(item.id) ? "border-primary bg-primary/10 ring-1 ring-primary/50" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"}`}>
                      <button className="block w-full text-left" onClick={(event) => onSelect(item.id, event)} onDoubleClick={() => onOpen(item.id)}>
                        <div className="relative aspect-square overflow-hidden bg-black/40">
                          <img src={previewSrc} alt={cleanName} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                          {isVideo ? <Badge className="absolute left-2 top-2 bg-black/70 text-white">Video</Badge> : null}
                          {durationLabel ? <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium text-white">{durationLabel}</div> : null}
                        </div>
                        <div className="space-y-2 p-3">
                          <div className={`truncate font-semibold text-white ${config.nameClass}`}>{cleanName}</div>
                          <div className={`${config.metaClass} text-muted-foreground`}>{item.width ?? "?"} x {item.height ?? "?"} - {item.extension}</div>
                          <div className="min-h-5">
                            <div className="flex flex-wrap gap-1">
                              {item.favorite ? <Badge className="bg-amber-400/20 text-amber-200">Favorite</Badge> : null}
                              {item.archived ? <Badge className="bg-white/10 text-white/70">Archived</Badge> : null}
                              {item.tags.slice(0, config.tagCount).map((tag) => <Badge key={tag.tag.id}>{tag.tag.name}</Badge>)}
                            </div>
                          </div>
                        </div>
                      </button>
                      <div className={`${config.metaClass} flex items-center justify-between border-t border-white/10 px-3 py-2 text-muted-foreground`}>
                        <span>{new Date(item.importedAt).toLocaleDateString()}</span>
                        <button className="text-primary" onClick={() => onOpen(item.id)}>Open</button>
                      </div>
                    </div>
                  );
                })}
                {Array.from({ length: Math.max(0, columnCount - row.length) }).map((_, fillerIndex) => (
                  <div key={`filler-${virtualRow.index}-${fillerIndex}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
