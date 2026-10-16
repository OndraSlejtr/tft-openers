import type { AugmentCategory, Comp, DataBundle, Opener } from "../data/types.ts";
import { type Overlay, emptyOverlay, parseOverlay, serializeOverlay } from "./overlay.ts";
import { type StorageAdapter, createMemoryStorage } from "./storage.ts";

export type StoreState = {
  selectedChampionIds: readonly string[];
  // Every opener, bundled defaults first, then the user's.
  openers: readonly Opener[];
  // Set when reading or writing storage failed, shown to the user until dismissed.
  storageError: string | null;
};

export type RankedOpener = {
  opener: Opener;
  displayName: string;
  coreMatchCount: number;
  targetMatchCount: number;
  score: number;
  // Best tier among the linked comps, null when none is linked.
  bestTier: string | null;
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
  // Saves a new active opener whose core is the current selection and returns its id.
  createOpenerFromSelection: () => string;
  // Active openers that share a champion with the selection, best match first.
  rankedOpeners: () => RankedOpener[];
  dismissStorageError: () => void;
  // Saves a new active opener with no champions and returns its id.
  createOpener: () => string;
  updateOpener: (openerId: string, changes: OpenerChanges) => void;
  // Puts a champion into the core or target list, or removes it from both with null.
  // A champion is never in both lists.
  placeChampion: (openerId: string, championId: string, list: ChampionList | null) => void;
  deleteOpener: (openerId: string) => void;
  // Name to show, generated from the core champions when the opener has no name.
  displayName: (opener: Opener) => string;
};

export type ChampionList = "core" | "target";

export type OpenerChanges = Partial<Pick<Opener, "name" | "notes" | "backline">>;

// A core match must outweigh any realistic number of target matches.
const CORE_WEIGHT = 100;
const TARGET_WEIGHT = 1;

const DEFAULT_AUGMENT_PRIORITY: AugmentCategory[] = ["econ", "item", "combat", "special"];

const TIER_ORDER = ["S", "A", "B", "C", "X"];

// Unknown tiers sort last.
const tierRank = (tier: string) => {
  const index = TIER_ORDER.indexOf(tier);
  return index === -1 ? TIER_ORDER.length : index;
};

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export const createStore = (bundle: DataBundle, storage: StorageAdapter = createMemoryStorage()): Store => {
  const championIds = new Set(bundle.champions.map(({ id }) => id));
  const championNames = new Map(bundle.champions.map(({ id, name }) => [id, name]));
  const compsBySlug = new Map(bundle.comps.map((comp) => [comp.slug, comp]));
  const listeners = new Set<() => void>();

  const loadOverlay = (): { overlay: Overlay; error: string | null } => {
    try {
      const text = storage.read();
      return { overlay: text === null ? emptyOverlay() : parseOverlay(text), error: null };
    } catch (error) {
      return { overlay: emptyOverlay(), error: `Could not load your saved data: ${errorMessage(error)}` };
    }
  };

  const loaded = loadOverlay();
  let overlay = loaded.overlay;
  let state: StoreState = { selectedChampionIds: [], openers: overlay.openers, storageError: loaded.error };

  const setState = (next: StoreState) => {
    state = next;
    for (const listener of listeners) listener();
  };

  // The change stays in memory when saving fails, so the app keeps working and shows the error.
  const saveOverlay = (nextOverlay: Overlay) => {
    overlay = nextOverlay;
    let storageError: string | null = null;
    try {
      storage.write(serializeOverlay(nextOverlay));
    } catch (error) {
      storageError = `Could not save your changes: ${errorMessage(error)}`;
    }
    setState({ ...state, openers: nextOverlay.openers, storageError: storageError ?? state.storageError });
  };

  const displayName = ({ name, coreChampionIds }: Opener) => {
    if (name.trim() !== "") return name.trim();
    const generated = coreChampionIds.map((id) => championNames.get(id) ?? id).join(" + ");
    return generated === "" ? "Empty opener" : generated;
  };

  const requireUserOpener = (openerId: string) => {
    const existing = overlay.openers.find(({ id }) => id === openerId);
    if (existing === undefined) throw new Error(`Unknown opener id "${openerId}"`);
    return existing;
  };

  const updateExisting = (openerId: string, change: (opener: Opener) => Opener) => {
    const existing = requireUserOpener(openerId);
    const updated = { ...change(existing), editedAtPatch: bundle.patch };
    saveOverlay({ ...overlay, openers: overlay.openers.map((opener) => (opener.id === openerId ? updated : opener)) });
  };

  const addOpener = (coreChampionIds: readonly string[]) => {
    const opener: Opener = {
      id: crypto.randomUUID(),
      name: "",
      coreChampionIds: [...coreChampionIds],
      targetChampionIds: [],
      backline: "flexible",
      requiredItems: [],
      augmentPriority: DEFAULT_AUGMENT_PRIORITY,
      keyAugmentIds: [],
      compSlugs: [],
      notes: "",
      source: "user",
      status: "active",
      editedAtPatch: bundle.patch,
    };
    saveOverlay({ ...overlay, openers: [...overlay.openers, opener] });
    return opener.id;
  };

  const bestTier = ({ compSlugs }: Opener) =>
    compSlugs
      .map((slug) => compsBySlug.get(slug)?.tier)
      .filter((tier): tier is string => tier !== undefined)
      .toSorted((a, b) => tierRank(a) - tierRank(b))[0] ?? null;

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
        ...state,
        selectedChampionIds: selectedChampionIds.includes(championId)
          ? selectedChampionIds.filter((id) => id !== championId)
          : [...selectedChampionIds, championId],
      });
    },
    clearSelection: () => {
      if (state.selectedChampionIds.length > 0) setState({ ...state, selectedChampionIds: [] });
    },
    createOpener: () => addOpener([]),
    createOpenerFromSelection: () => {
      if (state.selectedChampionIds.length === 0) throw new Error("Select at least one champion to create an opener");
      return addOpener(state.selectedChampionIds);
    },
    updateOpener: (openerId, changes) => updateExisting(openerId, (opener) => ({ ...opener, ...changes })),
    placeChampion: (openerId, championId, list) => {
      if (!championIds.has(championId)) throw new Error(`Unknown champion id "${championId}"`);
      updateExisting(openerId, (opener) => {
        const coreChampionIds = opener.coreChampionIds.filter((id) => id !== championId);
        const targetChampionIds = opener.targetChampionIds.filter((id) => id !== championId);
        return {
          ...opener,
          coreChampionIds: list === "core" ? [...coreChampionIds, championId] : coreChampionIds,
          targetChampionIds: list === "target" ? [...targetChampionIds, championId] : targetChampionIds,
          requiredItems: list === null ? opener.requiredItems.filter((entry) => entry.championId !== championId) : opener.requiredItems,
        };
      });
    },
    deleteOpener: (openerId) => {
      requireUserOpener(openerId);
      saveOverlay({ ...overlay, openers: overlay.openers.filter(({ id }) => id !== openerId) });
    },
    displayName,
    rankedOpeners: () =>
      state.openers
        .filter(({ status }) => status === "active")
        .map((opener) => {
          const coreMatchCount = opener.coreChampionIds.filter((id) => state.selectedChampionIds.includes(id)).length;
          const targetMatchCount = opener.targetChampionIds.filter((id) => state.selectedChampionIds.includes(id)).length;
          return {
            opener,
            displayName: displayName(opener),
            coreMatchCount,
            targetMatchCount,
            score: coreMatchCount * CORE_WEIGHT + targetMatchCount * TARGET_WEIGHT,
            bestTier: bestTier(opener),
          };
        })
        .filter(({ score }) => score > 0)
        .toSorted(
          (a, b) =>
            b.score - a.score ||
            tierRank(a.bestTier ?? "") - tierRank(b.bestTier ?? "") ||
            a.displayName.localeCompare(b.displayName),
        ),
    dismissStorageError: () => {
      if (state.storageError !== null) setState({ ...state, storageError: null });
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
