"use client";

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import type { AssetRecord } from "@/components/media/asset-workspace";
import { getCleanAssetDisplayName } from "@/lib/display-name";

const columnHelper = createColumnHelper<AssetRecord>();

const columns = [
  columnHelper.display({ id: "select", cell: (info) => info.row.original.id }),
  columnHelper.accessor("displayName", { header: "Name", cell: (info) => getCleanAssetDisplayName(info.row.original.displayName, info.row.original.originalFilename) }),
  columnHelper.accessor("mediaType", { header: "Type" }),
  columnHelper.accessor("source", { header: "Source" }),
  columnHelper.accessor("extension", { header: "Ext" }),
  columnHelper.display({ id: "resolution", header: "Resolution", cell: (info) => `${info.row.original.width ?? "?"} x ${info.row.original.height ?? "?"}` })
];

export function AssetTableView({ items, selectedIds, onSelect, onOpen }: { items: AssetRecord[]; selectedIds: Set<string>; onSelect: (id: string, event: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }) => void; onOpen: (id: string) => void }) {
  const table = useReactTable({ data: items, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="min-w-full text-sm">
        <thead className="bg-white/5 text-left text-muted-foreground">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id} className="px-3 py-2">{flexRender(header.column.columnDef.header, header.getContext())}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className={selectedIds.has(row.original.id) ? "bg-primary/10" : "border-t border-white/5"} onClick={(event) => onSelect(row.original.id, event)} onDoubleClick={() => onOpen(row.original.id)}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-3">
                  {cell.column.id === "select" ? (
                    <span className="text-primary">{selectedIds.has(row.original.id) ? "Selected" : "Click"}</span>
                  ) : cell.column.id === "displayName" ? (
                    <button className="font-medium hover:text-primary" onClick={(event) => { event.stopPropagation(); onOpen(row.original.id); }}>{String(cell.getValue() ?? "")}</button>
                  ) : (
                    flexRender(cell.column.columnDef.cell, cell.getContext())
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
