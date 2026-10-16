import type { Comp, DataBundle } from "../data/types.ts";

export type StoreState = {
  selectedChampionIds: readonly string[];
};

export type CompMatch = {
  comp: Comp;
  // Selected champions that are on the comp's final board.
  matchedChampionIds: string[];
};

export type Store = {
  getState: () => StoreState;
  subscribe: (listener: () => void) => () => void;
  toggleChampion: (championId: string) => void;
  clearSelection: () => void;
  compsWithSelectedChampions: () => CompMatch[];
};

const TIER_ORDER = ["S", "A", "B", "C", "X"];

// Unknown tiers sort last.
const tierRank = (tier: string) => {
  const index = TIER_ORDER.indexOf(tier);
  return index === -1 ? TIER_ORDER.length : index;
};

export const createStore = (bundle: DataBundle): Store => {
  const championIds = new Set(bundle.champions.map(({ id }) => id));
  const listeners = new Set<() => void>();
  let state: StoreState = { selectedChampionIds: [] };

  const setState = (next: StoreState) => {
    state = next;
    for (const listener of listeners) listener();
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    toggleChampion: (championId) => {
      if (!championIds.has(championId)) throw new Error(`Unknown champion id "${championId}"`);
      const { selectedChampionIds } = state;
      setState({
        selectedChampionIds: selectedChampionIds.includes(championId)
          ? selectedChampionIds.filter((id) => id !== championId)
          : [...selectedChampionIds, championId],
      });
    },
    clearSelection: () => {
      if (state.selectedChampionIds.length > 0) setState({ selectedChampionIds: [] });
    },
    // Comps with more selected champions first, then by tier and title.
    compsWithSelectedChampions: () =>
      bundle.comps
        .map((comp) => ({
          comp,
          matchedChampionIds: state.selectedChampionIds.filter((id) =>
            comp.finalBoard.some(({ championId }) => championId === id),
          ),
        }))
        .filter(({ matchedChampionIds }) => matchedChampionIds.length > 0)
        .toSorted(
          (a, b) =>
            b.matchedChampionIds.length - a.matchedChampionIds.length ||
            tierRank(a.comp.tier) - tierRank(b.comp.tier) ||
            a.comp.title.localeCompare(b.comp.title),
        ),
  };
};
