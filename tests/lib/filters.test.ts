import { describe, expect, it } from "vitest";
import { buildAssetOrderBy, buildAssetWhere } from "@/lib/filters";

describe("filters", () => {
  it("builds where clauses", () => {
    expect(buildAssetWhere({ limit: 60, sort: "newest", mediaType: "IMAGE", source: "midjourney" })).toMatchObject({ mediaType: "IMAGE", source: "midjourney", deletedAt: null });
  });

  it("returns newest ordering", () => {
    expect(buildAssetOrderBy("newest")[0]).toEqual({ importedAt: "desc" });
  });
});
