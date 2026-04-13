import { describe, expect, it } from "vitest";
import { selectionReducer, initialSelectionState } from "@/lib/selection";

describe("selectionReducer", () => {
  it("toggles ids", () => {
    const state = selectionReducer(initialSelectionState, { type: "toggle", id: "a" });
    expect(state.ids).toEqual(["a"]);
  });

  it("clears selection", () => {
    const state = selectionReducer({ ids: ["a"], anchorId: "a" }, { type: "clear" });
    expect(state.ids).toEqual([]);
  });
});
