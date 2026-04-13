export interface SelectionState {
  ids: string[];
  anchorId: string | null;
}

export type SelectionAction =
  | { type: "toggle"; id: string }
  | { type: "replace"; ids: string[]; anchorId?: string | null }
  | { type: "clear" }
  | { type: "range"; ids: string[] };

export const initialSelectionState: SelectionState = { ids: [], anchorId: null };

export function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case "toggle": {
      const set = new Set(state.ids);
      set.has(action.id) ? set.delete(action.id) : set.add(action.id);
      return { ids: [...set], anchorId: action.id };
    }
    case "replace":
      return { ids: action.ids, anchorId: action.anchorId ?? action.ids.at(-1) ?? null };
    case "range":
      return { ids: action.ids, anchorId: state.anchorId ?? action.ids[0] ?? null };
    case "clear":
      return initialSelectionState;
    default:
      return state;
  }
}
