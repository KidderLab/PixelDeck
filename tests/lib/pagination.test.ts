import { describe, expect, it } from "vitest";
import { encodeCursor, decodeCursor } from "@/lib/pagination";

describe("pagination", () => {
  it("round-trips cursor", () => {
    const input = { importedAt: new Date("2026-01-01T00:00:00.000Z"), id: "abc" };
    expect(decodeCursor(encodeCursor(input))).toEqual(input);
  });
});
