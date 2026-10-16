import { describe, expect, it, vi } from "vitest";
import type { Comp, DataBundle, Opener } from "../data/types.ts";
import { serializeOverlay } from "./overlay.ts";
import { createStore } from "./store.ts";
import { type StorageAdapter, createMemoryStorage } from "./storage.ts";

const champion = (id: string) => ({ id, name: id, cost: 1 as const, icon: null, variantIds: [id], traitIds: [] });

const comp = (slug: string, tier: string, finalChampionIds: string[], earlyChampionIds: string[] = []): Comp => ({
  slug,
  title: slug,
  tier,
  style: "Fast 8",
  difficulty: "EASY",
  mainChampionId: finalChampionIds[0],
  earlyBoard: earlyChampionIds.map((championId) => ({ championId, itemIds: [], stars: 1 })),
  finalBoard: finalChampionIds.map((championId) => ({ championId, itemIds: [], stars: 1 })),
  carouselItemIds: [],
  augmentIds: [],
  augmentTypes: [],
  stageTips: [],
  updated: "",
});

const bundle: DataBundle = {
  setNumber: 18,
  patch: "18.4b",
  traits: [],
  champions: ["azir", "karma", "teemo", "lux"].map(champion),
  components: [],
  items: [],
  augments: [],
  comps: [
    comp("azir-reroll", "A", ["azir", "teemo"]),
    comp("azir-karma", "S", ["azir", "karma"]),
    comp("azir-b", "B", ["azir"]),
    comp("early-only", "S", ["lux"], ["karma"]),
  ],
};

const slugs = (store: ReturnType<typeof createStore>) => store.compsWithSelectedChampions().map(({ comp: { slug } }) => slug);

describe("selection", () => {
  it("starts empty", () => {
    expect(createStore(bundle).getState().selectedChampionIds).toEqual([]);
  });

  it("toggles a champion on and off", () => {
    const store = createStore(bundle);
    store.toggleChampion("azir");
    expect(store.getState().selectedChampionIds).toEqual(["azir"]);
    store.toggleChampion("azir");
    expect(store.getState().selectedChampionIds).toEqual([]);
  });

  it("clears all selected champions in one action", () => {
    const store = createStore(bundle);
    store.toggleChampion("azir");
    store.toggleChampion("karma");
    store.clearSelection();
    expect(store.getState().selectedChampionIds).toEqual([]);
  });

  it("rejects an unknown champion", () => {
    expect(() => createStore(bundle).toggleChampion("nobody")).toThrow(/Unknown champion id "nobody"/);
  });

  it("notifies subscribers on change until they unsubscribe", () => {
    const store = createStore(bundle);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.toggleChampion("azir");
    store.clearSelection();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    store.toggleChampion("karma");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("does not notify when clearing an empty selection", () => {
    const store = createStore(bundle);
    const listener = vi.fn();
    store.subscribe(listener);
    store.clearSelection();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("comps with selected champions", () => {
  it("returns nothing without a selection", () => {
    expect(slugs(createStore(bundle))).toEqual([]);
  });

  it("lists comps whose final board has any selected champion", () => {
    const store = createStore(bundle);
    store.toggleChampion("teemo");
    expect(slugs(store)).toEqual(["azir-reroll"]);
  });

  it("ignores champions that are only on the early board", () => {
    const store = createStore(bundle);
    store.toggleChampion("karma");
    expect(slugs(store)).toEqual(["azir-karma"]);
  });

  it("reports which selected champions matched", () => {
    const store = createStore(bundle);
    store.toggleChampion("karma");
    store.toggleChampion("azir");
    const [first] = store.compsWithSelectedChampions();
    expect(first.comp.slug).toBe("azir-karma");
    expect(first.matchedChampionIds).toEqual(["karma", "azir"]);
  });

  it("orders by matches, then tier", () => {
    const store = createStore(bundle);
    store.toggleChampion("azir");
    store.toggleChampion("karma");
    expect(slugs(store)).toEqual(["azir-karma", "azir-reroll", "azir-b"]);
  });

  it("updates when the selection changes", () => {
    const store = createStore(bundle);
    store.toggleChampion("azir");
    store.toggleChampion("azir");
    expect(slugs(store)).toEqual([]);
  });
});

const opener = (id: string, overrides: Partial<Opener> = {}): Opener => ({
  id,
  name: id,
  coreChampionIds: [],
  targetChampionIds: [],
  backline: "flexible",
  requiredItems: [],
  augmentPriority: ["econ", "item", "combat", "special"],
  keyAugmentIds: [],
  compSlugs: [],
  notes: "",
  source: "user",
  status: "active",
  editedAtPatch: "18.4b",
  ...overrides,
});

const storeWithOpeners = (openers: Opener[]) =>
  createStore(bundle, createMemoryStorage(serializeOverlay({ version: 1, openers })));

const rankedIds = (store: ReturnType<typeof createStore>) => store.rankedOpeners().map(({ opener: { id } }) => id);

describe("create opener from selection", () => {
  it("saves an active user opener with the selection as core", () => {
    const store = createStore(bundle);
    store.toggleChampion("azir");
    store.toggleChampion("karma");
    const id = store.createOpenerFromSelection();
    const created = store.getState().openers.find((entry) => entry.id === id);
    expect(created).toMatchObject({
      coreChampionIds: ["azir", "karma"],
      targetChampionIds: [],
      source: "user",
      status: "active",
      editedAtPatch: "18.4b",
    });
  });

  it("rejects an empty selection", () => {
    expect(() => createStore(bundle).createOpenerFromSelection()).toThrow(/Select at least one champion/);
  });

  it("survives a reload through the storage adapter", () => {
    const storage = createMemoryStorage();
    const first = createStore(bundle, storage);
    first.toggleChampion("azir");
    const id = first.createOpenerFromSelection();
    const reloaded = createStore(bundle, storage);
    expect(reloaded.getState().openers.map((entry) => entry.id)).toEqual([id]);
    expect(reloaded.getState().storageError).toBeNull();
  });

  it("generates a display name from the core champions", () => {
    const store = createStore(bundle);
    store.toggleChampion("azir");
    store.toggleChampion("karma");
    store.createOpenerFromSelection();
    expect(store.rankedOpeners()[0].displayName).toBe("azir + karma");
  });
});

describe("ranked openers", () => {
  it("returns nothing without a selection", () => {
    expect(rankedIds(storeWithOpeners([opener("a", { coreChampionIds: ["azir"] })]))).toEqual([]);
  });

  it("ranks by core matches, and a core match beats any target matches", () => {
    const store = storeWithOpeners([
      opener("targets", { targetChampionIds: ["azir", "karma", "teemo"] }),
      opener("core", { coreChampionIds: ["azir"] }),
    ]);
    for (const id of ["azir", "karma", "teemo"]) store.toggleChampion(id);
    expect(rankedIds(store)).toEqual(["core", "targets"]);
  });

  it("raises the rank for held target champions", () => {
    const store = storeWithOpeners([
      opener("plain", { coreChampionIds: ["azir"] }),
      opener("with-target", { coreChampionIds: ["azir"], targetChampionIds: ["karma"] }),
    ]);
    store.toggleChampion("azir");
    store.toggleChampion("karma");
    expect(rankedIds(store)).toEqual(["with-target", "plain"]);
  });

  it("breaks ties by the best linked comp tier", () => {
    const store = storeWithOpeners([
      opener("b-tier", { coreChampionIds: ["azir"], compSlugs: ["azir-b"] }),
      opener("no-comp", { coreChampionIds: ["azir"] }),
      opener("s-tier", { coreChampionIds: ["azir"], compSlugs: ["azir-b", "azir-karma"] }),
    ]);
    store.toggleChampion("azir");
    expect(rankedIds(store)).toEqual(["s-tier", "b-tier", "no-comp"]);
  });

  it("ignores dead comp links when picking the best tier", () => {
    const store = storeWithOpeners([
      opener("dead", { coreChampionIds: ["azir"], compSlugs: ["gone"] }),
      opener("live", { coreChampionIds: ["azir"], compSlugs: ["azir-b"] }),
    ]);
    store.toggleChampion("azir");
    expect(rankedIds(store)).toEqual(["live", "dead"]);
  });

  it("excludes drafts and openers without a match", () => {
    const store = storeWithOpeners([
      opener("draft", { coreChampionIds: ["azir"], status: "draft" }),
      opener("other", { coreChampionIds: ["teemo"] }),
      opener("match", { coreChampionIds: ["azir"] }),
    ]);
    store.toggleChampion("azir");
    expect(rankedIds(store)).toEqual(["match"]);
  });

  it("updates instantly when the selection changes", () => {
    const store = storeWithOpeners([opener("a", { coreChampionIds: ["azir"] })]);
    store.toggleChampion("azir");
    expect(rankedIds(store)).toEqual(["a"]);
    store.toggleChampion("azir");
    expect(rankedIds(store)).toEqual([]);
  });

  it("reports match counts and the best tier", () => {
    const store = storeWithOpeners([
      opener("a", { coreChampionIds: ["azir", "karma"], targetChampionIds: ["teemo"], compSlugs: ["azir-reroll"] }),
    ]);
    store.toggleChampion("azir");
    store.toggleChampion("teemo");
    expect(store.rankedOpeners()[0]).toMatchObject({ coreMatchCount: 1, targetMatchCount: 1, bestTier: "A" });
  });
});

describe("storage failures", () => {
  const failingStorage = (overrides: Partial<StorageAdapter>): StorageAdapter => ({
    read: () => null,
    write: () => undefined,
    ...overrides,
  });

  it("shows an error when saving fails and keeps the opener in memory", () => {
    const store = createStore(
      bundle,
      failingStorage({
        write: () => {
          throw new Error("quota exceeded");
        },
      }),
    );
    store.toggleChampion("azir");
    store.createOpenerFromSelection();
    expect(store.getState().storageError).toMatch(/Could not save your changes: quota exceeded/);
    expect(store.getState().openers).toHaveLength(1);
  });

  it("shows an error when reading fails", () => {
    const store = createStore(
      bundle,
      failingStorage({
        read: () => {
          throw new Error("denied");
        },
      }),
    );
    expect(store.getState().storageError).toMatch(/Could not load your saved data: denied/);
  });

  it("shows an error for corrupt saved data and starts empty", () => {
    const store = createStore(bundle, createMemoryStorage("{not json"));
    expect(store.getState().storageError).toMatch(/Could not load your saved data/);
    expect(store.getState().openers).toEqual([]);
  });

  it("shows an error for saved data with the wrong shape", () => {
    const store = createStore(bundle, createMemoryStorage(JSON.stringify({ version: 1, openers: [{ id: 1 }] })));
    expect(store.getState().storageError).toMatch(/openers\[0\]/);
  });

  it("clears the error when dismissed", () => {
    const store = createStore(bundle, createMemoryStorage("{not json"));
    store.dismissStorageError();
    expect(store.getState().storageError).toBeNull();
  });
});

describe("opener editing", () => {
  const openerById = (store: ReturnType<typeof createStore>, id: string) => {
    const found = store.getState().openers.find((entry) => entry.id === id);
    if (found === undefined) throw new Error(`Missing opener ${id}`);
    return found;
  };

  it("creates an empty active opener", () => {
    const store = createStore(bundle);
    const id = store.createOpener();
    expect(openerById(store, id)).toMatchObject({
      coreChampionIds: [],
      targetChampionIds: [],
      backline: "flexible",
      status: "active",
      source: "user",
    });
  });

  it("updates name, notes and backline and records the patch", () => {
    const store = storeWithOpeners([opener("a", { editedAtPatch: "18.1" })]);
    store.updateOpener("a", { name: "Mine", notes: "Roll at 3-2", backline: "AP" });
    expect(openerById(store, "a")).toMatchObject({ name: "Mine", notes: "Roll at 3-2", backline: "AP", editedAtPatch: "18.4b" });
  });

  it("persists updates", () => {
    const storage = createMemoryStorage();
    const first = createStore(bundle, storage);
    const id = first.createOpener();
    first.updateOpener(id, { notes: "kept" });
    expect(openerById(createStore(bundle, storage), id).notes).toBe("kept");
  });

  it("generates a name from the core champions while the name is empty", () => {
    const store = createStore(bundle);
    const id = store.createOpener();
    expect(store.displayName(openerById(store, id))).toBe("Empty opener");
    store.placeChampion(id, "azir", "core");
    store.placeChampion(id, "karma", "core");
    expect(store.displayName(openerById(store, id))).toBe("azir + karma");
    store.updateOpener(id, { name: "  My plan " });
    expect(store.displayName(openerById(store, id))).toBe("My plan");
    store.updateOpener(id, { name: "   " });
    expect(store.displayName(openerById(store, id))).toBe("azir + karma");
  });

  it("moves a champion between core and target without duplicating it", () => {
    const store = storeWithOpeners([opener("a")]);
    store.placeChampion("a", "azir", "core");
    store.placeChampion("a", "azir", "target");
    expect(openerById(store, "a")).toMatchObject({ coreChampionIds: [], targetChampionIds: ["azir"] });
    store.placeChampion("a", "azir", "core");
    expect(openerById(store, "a")).toMatchObject({ coreChampionIds: ["azir"], targetChampionIds: [] });
  });

  it("does not add a champion twice to the same list", () => {
    const store = storeWithOpeners([opener("a")]);
    store.placeChampion("a", "azir", "core");
    store.placeChampion("a", "azir", "core");
    expect(openerById(store, "a").coreChampionIds).toEqual(["azir"]);
  });

  it("removes a champion from both lists", () => {
    const store = storeWithOpeners([opener("a", { coreChampionIds: ["azir"], targetChampionIds: ["karma"] })]);
    store.placeChampion("a", "azir", null);
    store.placeChampion("a", "karma", null);
    expect(openerById(store, "a")).toMatchObject({ coreChampionIds: [], targetChampionIds: [] });
  });

  it("rejects unknown openers and champions", () => {
    const store = storeWithOpeners([opener("a")]);
    expect(() => store.updateOpener("nope", { name: "x" })).toThrow(/Unknown opener id "nope"/);
    expect(() => store.deleteOpener("nope")).toThrow(/Unknown opener id "nope"/);
    expect(() => store.placeChampion("a", "nobody", "core")).toThrow(/Unknown champion id "nobody"/);
  });

  it("deletes an opener and keeps that after a reload", () => {
    const storage = createMemoryStorage();
    const store = createStore(bundle, storage);
    const keep = store.createOpener();
    const drop = store.createOpener();
    store.deleteOpener(drop);
    expect(createStore(bundle, storage).getState().openers.map(({ id }) => id)).toEqual([keep]);
  });

  it("ranks an edited opener right away", () => {
    const store = createStore(bundle);
    const id = store.createOpener();
    store.toggleChampion("teemo");
    expect(rankedIds(store)).toEqual([]);
    store.placeChampion(id, "teemo", "target");
    expect(rankedIds(store)).toEqual([id]);
  });
});
