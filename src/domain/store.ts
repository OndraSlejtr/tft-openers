import type { Augment, AugmentCategory, Champion, Comp, CompletedItem, Component, DataBundle, ItemCategory, Opener } from "../data/types.ts";
import { type CategoryOverride, type Overlay, emptyOverlay, parseOverlay, serializeOverlay } from "./overlay.ts";
import { type StorageAdapter, createMemoryStorage } from "./storage.ts";

export type StoreState = {
  selectedChampionIds: readonly string[];
  // Every opener, bundled defaults first, then the user's.
  openers: readonly Opener[];
  // Bundled items and augments with the user's category overrides applied. Overridden entries are not guessed.
  items: readonly CompletedItem[];
  augments: readonly Augment[];
  // Set when reading or writing storage failed, shown to the user until dismissed.
  storageError: string | null;
};

export type CarryItem = {
  itemId: string;
  // Null for items outside the bundle's item list, such as artifacts and radiants.
  item: CompletedItem | null;
  components: Component[];
};

export type CompRow =
  | { dead: true; slug: string }
  | {
      dead: false;
      comp: Comp;
      // Units on the final board that the opener's core does not cover, cheapest first.
      missingUnits: Champion[];
      carry: { champion: Champion; items: CarryItem[] } | null;
      keyAugments: Augment[];
    };

export type OpenerDetail = {
  opener: Opener;
  displayName: string;
  // One row per linked comp, in link order.
  compRows: CompRow[];
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
  // The champion must be in the opener. Adding an item the champion already has changes nothing.
  addRequiredItem: (openerId: string, championId: string, itemId: string) => void;
  removeRequiredItem: (openerId: string, championId: string, itemId: string) => void;
  // Must list each of the four augment categories exactly once.
  setAugmentPriority: (openerId: string, priority: AugmentCategory[]) => void;
  addKeyAugment: (openerId: string, augmentId: string) => void;
  removeKeyAugment: (openerId: string, augmentId: string) => void;
  // Replaces the bundled guess with the given categories and marks them confirmed.
  setItemCategories: (itemId: string, categories: ItemCategory[]) => void;
  setAugmentCategories: (augmentId: string, categories: AugmentCategory[]) => void;
  // Restores the bundled guess.
  clearItemCategories: (itemId: string) => void;
  clearAugmentCategories: (augmentId: string) => void;
  linkComp: (openerId: string, compSlug: string) => void;
  // Also works for links to comps that no longer exist.
  unlinkComp: (openerId: string, compSlug: string) => void;
  // Name to show, generated from the core champions when the opener has no name.
  displayName: (opener: Opener) => string;
  // Null when the opener does not exist.
  openerDetail: (openerId: string) => OpenerDetail | null;
};

export type ChampionList = "core" | "target";

export type OpenerChanges = Partial<Pick<Opener, "name" | "notes" | "backline">>;

export const MAX_ITEMS_PER_CHAMPION = 3;

// A core match must outweigh any realistic number of target matches.
const CORE_WEIGHT = 100;
const TARGET_WEIGHT = 1;

const AUGMENT_CATEGORIES: AugmentCategory[] = ["econ", "item", "combat", "special"];

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
  const itemIds = new Set(bundle.items.map(({ id }) => id));
  const augmentIds = new Set(bundle.augments.map(({ id }) => id));
  const championsById = new Map(bundle.champions.map((champion) => [champion.id, champion]));
  const itemsById = new Map(bundle.items.map((item) => [item.id, item]));
  const componentsById = new Map(bundle.components.map((component) => [component.id, component]));
  const augmentsById = new Map(bundle.augments.map((augment) => [augment.id, augment]));
  const compsBySlug = new Map(bundle.comps.map((comp) => [comp.slug, comp]));
  const listeners = new Set<() => void>();

  const applyOverrides = <Entry extends { id: string; categories: string[]; guessed: boolean }, Category extends string>(
    entries: readonly Entry[],
    overrides: readonly CategoryOverride<Category>[],
  ): Entry[] =>
    entries.map((entry) => {
      const override = overrides.find(({ id }) => id === entry.id);
      return override === undefined ? entry : { ...entry, categories: override.categories, guessed: false };
    });

  function effectiveData({ openers, itemOverrides, augmentOverrides }: Overlay) {
    return {
      openers,
      items: applyOverrides(bundle.items, itemOverrides),
      augments: applyOverrides(bundle.augments, augmentOverrides),
    };
  }

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
  let state: StoreState = {
    selectedChampionIds: [],
    ...effectiveData(overlay),
    storageError: loaded.error,
  };

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
    setState({ ...state, ...effectiveData(nextOverlay), storageError: storageError ?? state.storageError });
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
      augmentPriority: AUGMENT_CATEGORIES,
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

  const compRow = (opener: Opener, slug: string): CompRow => {
    const comp = compsBySlug.get(slug);
    if (comp === undefined) return { dead: true, slug };
    const missingUnits = [...new Set(comp.finalBoard.map(({ championId }) => championId))]
      .filter((id) => !opener.coreChampionIds.includes(id))
      .map((id) => championsById.get(id))
      .filter((champion): champion is Champion => champion !== undefined)
      .toSorted((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
    const carryChampion = championsById.get(comp.mainChampionId);
    const carryUnit = comp.finalBoard.find(({ championId }) => championId === comp.mainChampionId);
    return {
      dead: false,
      comp,
      missingUnits,
      carry:
        carryChampion === undefined
          ? null
          : {
              champion: carryChampion,
              items: (carryUnit?.itemIds ?? []).map((itemId) => {
                const item = itemsById.get(itemId) ?? null;
                const components = (item?.componentIds ?? [])
                  .map((id) => componentsById.get(id))
                  .filter((component): component is Component => component !== undefined);
                return { itemId, item, components };
              }),
            },
      keyAugments: comp.augmentIds
        .map((id) => augmentsById.get(id))
        .filter((augment): augment is Augment => augment !== undefined),
    };
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
    addRequiredItem: (openerId, championId, itemId) => {
      if (!itemIds.has(itemId)) throw new Error(`Unknown item id "${itemId}"`);
      updateExisting(openerId, (opener) => {
        if (![...opener.coreChampionIds, ...opener.targetChampionIds].includes(championId)) {
          throw new Error(`Champion "${championId}" is not in this opener`);
        }
        const current = opener.requiredItems.find((entry) => entry.championId === championId)?.itemIds ?? [];
        if (current.includes(itemId)) return opener;
        if (current.length >= MAX_ITEMS_PER_CHAMPION) {
          throw new Error(`A champion holds at most ${MAX_ITEMS_PER_CHAMPION} items`);
        }
        const entry = { championId, itemIds: [...current, itemId] };
        const others = opener.requiredItems.filter((other) => other.championId !== championId);
        return { ...opener, requiredItems: [...others, entry] };
      });
    },
    removeRequiredItem: (openerId, championId, itemId) =>
      updateExisting(openerId, (opener) => ({
        ...opener,
        requiredItems: opener.requiredItems
          .map((entry) =>
            entry.championId === championId ? { ...entry, itemIds: entry.itemIds.filter((id) => id !== itemId) } : entry,
          )
          .filter((entry) => entry.itemIds.length > 0),
      })),
    setAugmentPriority: (openerId, priority) => {
      const isPermutation =
        priority.length === AUGMENT_CATEGORIES.length && AUGMENT_CATEGORIES.every((category) => priority.includes(category));
      if (!isPermutation) throw new Error("Augment priority must list econ, item, combat and special once each");
      updateExisting(openerId, (opener) => ({ ...opener, augmentPriority: [...priority] }));
    },
    addKeyAugment: (openerId, augmentId) => {
      if (!augmentIds.has(augmentId)) throw new Error(`Unknown augment id "${augmentId}"`);
      updateExisting(openerId, (opener) =>
        opener.keyAugmentIds.includes(augmentId) ? opener : { ...opener, keyAugmentIds: [...opener.keyAugmentIds, augmentId] },
      );
    },
    removeKeyAugment: (openerId, augmentId) =>
      updateExisting(openerId, (opener) => ({ ...opener, keyAugmentIds: opener.keyAugmentIds.filter((id) => id !== augmentId) })),
    setItemCategories: (itemId, categories) => {
      if (!itemIds.has(itemId)) throw new Error(`Unknown item id "${itemId}"`);
      const entry = { id: itemId, categories: [...new Set(categories)], editedAtPatch: bundle.patch };
      saveOverlay({ ...overlay, itemOverrides: [...overlay.itemOverrides.filter(({ id }) => id !== itemId), entry] });
    },
    setAugmentCategories: (augmentId, categories) => {
      if (!augmentIds.has(augmentId)) throw new Error(`Unknown augment id "${augmentId}"`);
      const entry = { id: augmentId, categories: [...new Set(categories)], editedAtPatch: bundle.patch };
      saveOverlay({ ...overlay, augmentOverrides: [...overlay.augmentOverrides.filter(({ id }) => id !== augmentId), entry] });
    },
    clearItemCategories: (itemId) =>
      saveOverlay({ ...overlay, itemOverrides: overlay.itemOverrides.filter(({ id }) => id !== itemId) }),
    clearAugmentCategories: (augmentId) =>
      saveOverlay({ ...overlay, augmentOverrides: overlay.augmentOverrides.filter(({ id }) => id !== augmentId) }),
    linkComp: (openerId, compSlug) => {
      if (!compsBySlug.has(compSlug)) throw new Error(`Unknown comp "${compSlug}"`);
      updateExisting(openerId, (opener) =>
        opener.compSlugs.includes(compSlug) ? opener : { ...opener, compSlugs: [...opener.compSlugs, compSlug] },
      );
    },
    unlinkComp: (openerId, compSlug) =>
      updateExisting(openerId, (opener) => ({ ...opener, compSlugs: opener.compSlugs.filter((slug) => slug !== compSlug) })),
    displayName,
    openerDetail: (openerId) => {
      const opener = state.openers.find(({ id }) => id === openerId);
      if (opener === undefined) return null;
      return { opener, displayName: displayName(opener), compRows: opener.compSlugs.map((slug) => compRow(opener, slug)) };
    },
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
