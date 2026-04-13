import { describe, expect, it } from "vitest";
import { assetListSchema } from "@/lib/validation";

describe("validation", () => {
  it("parses defaults", () => {
    const result = assetListSchema.parse({});
    expect(result.limit).toBe(60);
    expect(result.sort).toBe("newest");
  });
});
